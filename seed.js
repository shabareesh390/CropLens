const admin = require("firebase-admin");
const path = require("path");

// Try to initialize, assuming GOOGLE_APPLICATION_CREDENTIALS is set,
// or run it against emulators if FIREBASE_AUTH_EMULATOR_HOST is set.
try {
  admin.initializeApp();
} catch (e) {
  console.log("InitializeApp failed. Make sure you set GOOGLE_APPLICATION_CREDENTIALS or use emulators.");
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const SEED = [
  { id:"KCC-2026-00148", name:"Irfan Sheikh", phone:"9342•••871", aadhaarMask:"•••• •••• 7741", district:"Belagavi", village:"Hukkeri", rorId:"RoR/BLG/2025/04417", surveyNo:"114/2A", areaAcres:3.4, crop:"Soybean", coords:"16.1828° N, 74.7822° E", score:88, status:"approved", loanAmount:305000, yieldEstTonnes:1.7, incomeEst:790500, submittedAt:"2026-06-15", decidedAt:"2026-06-15", priceTrend:[4310,4480,4390,4520,4610,4650] },
  { id:"KCC-2026-00147", name:"Basavaraj Patil", phone:"9876•••220", aadhaarMask:"•••• •••• 5512", district:"Belagavi", village:"Raibag", rorId:"RoR/BLG/2025/03981", surveyNo:"47/1", areaAcres:5.2, crop:"Sugarcane", coords:"16.5193° N, 74.7841° E", score:91, status:"approved", loanAmount:410000, yieldEstTonnes:72.8, incomeEst:2475200, submittedAt:"2026-06-14", decidedAt:"2026-06-14", priceTrend:[320,332,338,335,341,340] },
  { id:"KCC-2026-00146", name:"Lakshmi Devi", phone:"9123•••904", aadhaarMask:"•••• •••• 3387", district:"Mandya", village:"Maddur", rorId:"RoR/MYS/2025/01122", surveyNo:"29/3B", areaAcres:2.1, crop:"Paddy", coords:"12.5848° N, 77.0417° E", score:84, status:"approved", loanAmount:240000, yieldEstTonnes:2.3, incomeEst:547400, submittedAt:"2026-06-13", decidedAt:"2026-06-13", priceTrend:[2280,2310,2350,2330,2370,2380] },
  { id:"KCC-2026-00145", name:"Geeta Kulkarni", phone:"9988•••441", aadhaarMask:"•••• •••• 6620", district:"Dharwad", village:"Kalghatgi", rorId:"RoR/DWD/2025/02290", surveyNo:"82/1", areaAcres:4.0, crop:"Wheat", coords:"15.1842° N, 75.0440° E", score:70, status:"pending", loanAmount:215000, yieldEstTonnes:3.6, incomeEst:882000, submittedAt:"2026-06-16", decidedAt:null, priceTrend:[2390,2410,2430,2440,2460,2450] },
  { id:"KCC-2026-00144", name:"Ramesh Naik", phone:"9012•••309", aadhaarMask:"•••• •••• 9954", district:"Dharwad", village:"Navalgund", rorId:"RoR/DWD/2025/02156", surveyNo:"61/4", areaAcres:6.5, crop:"Cotton", coords:"15.5511° N, 75.3597° E", score:76, status:"pending", loanAmount:290000, yieldEstTonnes:2.3, incomeEst:1641600, submittedAt:"2026-06-17", decidedAt:null, priceTrend:[7020,7110,7180,7090,7240,7200] },
  { id:"KCC-2026-00143", name:"Ningappa Talawar", phone:"9765•••812", aadhaarMask:"•••• •••• 2298", district:"Hassan", village:"Arsikere", rorId:"RoR/HSN/2025/00871", surveyNo:"18/2", areaAcres:3.0, crop:"Maize", coords:"13.3133° N, 76.2575° E", score:65, status:"review", loanAmount:195000, yieldEstTonnes:3.0, incomeEst:636000, submittedAt:"2026-06-12", decidedAt:null, priceTrend:[2080,2110,2105,2140,2130,2120] },
  { id:"KCC-2026-00142", name:"Manjunath Gowda", phone:"9456•••673", aadhaarMask:"•••• •••• 7783", district:"Hassan", village:"Sakleshpur", rorId:"RoR/HSN/2025/00765", surveyNo:"55/1A", areaAcres:1.8, crop:"Coffee", coords:"12.9421° N, 75.7848° E", score:58, status:"review", loanAmount:180000, yieldEstTonnes:0.72, incomeEst:1332000, submittedAt:"2026-06-11", decidedAt:null, priceTrend:[18200,18400,18350,18500,18450,18500] },
  { id:"KCC-2026-00141", name:"Sunita Bai", phone:"9345•••118", aadhaarMask:"•••• •••• 4408", district:"Mandya", village:"T. Narsipur", rorId:"RoR/MYS/2025/00998", surveyNo:"33/2", areaAcres:1.1, crop:"Paddy", coords:"12.2179° N, 76.8988° E", score:39, status:"declined", loanAmount:120000, yieldEstTonnes:1.54, incomeEst:366520, submittedAt:"2026-06-10", decidedAt:"2026-06-10", priceTrend:[2300,2280,2260,2270,2290,2280] },
];

async function seed() {
  const email = "priya@sbi-croplens.in";
  const password = "CropLens@2026";
  let user;

  try {
    user = await auth.getUserByEmail(email);
    console.log(`User ${email} already exists. UID: ${user.uid}`);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      user = await auth.createUser({
        email,
        password,
        displayName: "Priya Nair",
      });
      console.log(`Created user ${email} with UID: ${user.uid}`);
    } else {
      console.error("Error fetching user:", error);
      process.exit(1);
    }
  }

  const officerData = {
    name: "Priya Nair",
    role: "Credit Officer",
    branch: "SBI RACPC · Mangaluru",
    initials: "PN",
    assignedDistricts: [
      "Belagavi", "Dharwad", "Hassan", "Mandya", "Mysuru", 
      "Bengaluru Urban", "Tumakuru", "Kalaburagi" // sample 8
    ]
  };

  await db.collection("officers").doc(user.uid).set(officerData);
  console.log("Created officer document");

  const appsRef = db.collection("applications");
  
  // Clear old seed apps for this officer to avoid duplicates if run multiple times
  const oldApps = await appsRef.where("officerId", "==", user.uid).get();
  const batch = db.batch();
  oldApps.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  for (const app of SEED) {
    const docData = {
      ...app,
      officerId: user.uid,
      officerName: officerData.name,
      branch: officerData.branch,
      submittedAt: new Date(app.submittedAt),
      decidedAt: app.decidedAt ? new Date(app.decidedAt) : null,
    };
    await appsRef.add(docData);
  }

  console.log("Successfully seeded 8 applications.");
  console.log("-----------------------------------------");
  console.log("TEST CREDENTIALS:");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("-----------------------------------------");
  
  process.exit(0);
}

seed().catch(console.error);
