const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const CROP_TABLE = {
  "Paddy": { yield: 1.1, fallbackPrice: 2380 },
  "Wheat": { yield: 0.9, fallbackPrice: 2450 },
  "Maize": { yield: 1.0, fallbackPrice: 2120 },
  "Sugarcane": { yield: 14, fallbackPrice: 340 },
  "Cotton": { yield: 0.35, fallbackPrice: 7200 },
  "Soybean": { yield: 0.5, fallbackPrice: 4650 },
  "Coffee": { yield: 0.4, fallbackPrice: 18500 },
  // defaults for others
  "Ragi": { yield: 1.2, fallbackPrice: 3500 },
  "Jowar": { yield: 0.8, fallbackPrice: 3100 },
  "Tur": { yield: 0.4, fallbackPrice: 7000 },
  "Groundnut": { yield: 0.7, fallbackPrice: 6500 },
  "Sunflower": { yield: 0.6, fallbackPrice: 6000 },
  "Arecanut": { yield: 0.8, fallbackPrice: 40000 },
  "Coconut": { yield: 4.0, fallbackPrice: 3000 },
  "Tomato": { yield: 15.0, fallbackPrice: 1500 },
  "Onion": { yield: 10.0, fallbackPrice: 2000 },
  "Chilly": { yield: 1.5, fallbackPrice: 15000 },
};

exports.runSatelliteScan = onCall({ timeoutSeconds: 30 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }
  
  const { firestoreId, crop, areaAcres, district, coords } = request.data;
  if (!firestoreId || !crop || !areaAcres) {
    throw new HttpsError("invalid-argument", "Missing required parameters.");
  }

  // 1. Sequential sleeps
  await sleep(1000); // Fetching Sentinel-2
  await sleep(1000); // Classifying crop
  await sleep(1000); // Estimating yield
  await sleep(1000); // Cross-referencing prices
  await sleep(500);  // Computing score

  // 2. Compute NDVI (0.32 - 0.85) seeded from firestoreId
  const hash = crypto.createHash("md5").update(firestoreId).digest("hex");
  const seedNum = parseInt(hash.substring(0, 8), 16);
  const ndvi = 0.32 + (seedNum % 540) / 1000; // range 0.32 - 0.85 approx

  // 3. Compute Yield
  const cropData = CROP_TABLE[crop] || { yield: 1.0, fallbackPrice: 2000 };
  const baseYield = cropData.yield;
  const yieldEstTonnes = areaAcres * baseYield * (0.7 + ndvi * 0.65);

  // 4. Fetch Mandi prices
  let currentPrice = cropData.fallbackPrice;
  let fetchedPrices = [];
  try {
    const apiKey = process.env.DATA_GOV_KEY || "dummy";
    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&filters[State]=Karnataka&filters[District]=${encodeURIComponent(district)}&filters[Commodity]=${encodeURIComponent(crop)}&limit=6&sort[Arrival_Date]=desc`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.records && data.records.length > 0) {
      currentPrice = parseFloat(data.records[0].modal_price) || currentPrice;
      fetchedPrices = data.records.map(r => parseFloat(r.modal_price)).filter(p => !isNaN(p));
    }
  } catch (err) {
    console.warn("Failed to fetch mandi prices, using fallback.", err);
  }

  // 5. Compute incomeEst
  const incomeEst = Math.round(yieldEstTonnes * 10 * currentPrice);

  // 6. Compute priceTrend
  const priceTrend = fetchedPrices.length >= 6 ? fetchedPrices.slice(0, 6).reverse() : Array.from({ length: 6 }, (_, i) => {
    const wobble = ((seedNum + i * 37) % 11) - 5;
    return Math.round(currentPrice * (1 + (i - 5) * 0.006) + wobble * (currentPrice / 500));
  });

  // 7. Compute score
  const ndviScore = Math.min(55, Math.round((ndvi - 0.2) * 80));
  const areaScore = Math.min(20, Math.round(areaAcres * 2.5));
  const incomeScore = Math.min(25, Math.round(incomeEst / 50000));
  const score = Math.max(22, Math.min(96, ndviScore + areaScore + incomeScore));

  // 8. Compute loanAmount
  const loanAmount = Math.round((incomeEst * 0.65) / 1000) * 1000;

  // 9. Update Firestore
  const db = admin.firestore();
  const appRef = db.collection("applications").doc(firestoreId);
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  await appRef.update({
    score,
    yieldEstTonnes: parseFloat(yieldEstTonnes.toFixed(2)),
    incomeEst,
    loanAmount,
    priceTrend,
    ndvi: parseFloat(ndvi.toFixed(2)),
    status: "pending",
    scanCompletedAt: now,
    auditLog: admin.firestore.FieldValue.arrayUnion({
      action: "Satellite Scan Completed",
      timestamp: new Date().toISOString(), // we use client format for UI compatibility if needed, or better, serverTimestamp might not work well in arrayUnion if we want a structured object, but arrayUnion with object is fine. Wait, let's stick to an object.
      // Note: serverTimestamp() cannot be used inside arrayUnion in some older SDKs, but is supported in modern ones. To be safe for the UI, let's use an ISO string.
    })
  });

  return {
    score,
    yieldEstTonnes: parseFloat(yieldEstTonnes.toFixed(2)),
    incomeEst,
    loanAmount,
    priceTrend,
    ndvi: parseFloat(ndvi.toFixed(2))
  };
});
