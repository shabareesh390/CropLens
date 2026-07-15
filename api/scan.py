from http.server import BaseHTTPRequestHandler
import json

YIELD_TABLE = {
    "Paddy": 1.1, "Wheat": 0.9, "Maize": 1.0, "Sugarcane": 14,
    "Cotton": 0.35, "Soybean": 0.5, "Coffee": 0.4, "Ragi": 0.8,
    "Jowar": 0.7, "Tur": 0.6, "Groundnut": 0.9, "Sunflower": 0.6,
    "Arecanut": 2.5, "Coconut": 8.0, "Tomato": 12.0, "Onion": 10.0,
    "Chilly": 1.2
}

PRICE_TABLE = {
    "Paddy": 2380, "Wheat": 2450, "Maize": 2120, "Sugarcane": 340,
    "Cotton": 7200, "Soybean": 4650, "Coffee": 18500, "Ragi": 3846,
    "Jowar": 3180, "Tur": 7000, "Groundnut": 6377, "Sunflower": 6400,
    "Arecanut": 50000, "Coconut": 3200, "Tomato": 1800, "Onion": 2200,
    "Chilly": 12000
}

def hash_str(s):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % 99991
    return h

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        data = json.loads(self.rfile.read(length))

        firestore_id = data.get("firestoreId", "default")
        crop = data.get("crop", "Paddy")
        area_acres = float(data.get("areaAcres", 1.0))
        district = data.get("district", "Belagavi")

        ndvi = 0.32 + (hash_str(firestore_id) % 53) / 100

        base_yield = YIELD_TABLE.get(crop, 1.0)
        yield_est = round(area_acres * base_yield * (0.7 + ndvi * 0.65), 2)

        current_price = PRICE_TABLE.get(crop, 2000)
        price_trend = [
            round(
                current_price * (0.93 + i * 0.015) +
                (hash_str(firestore_id + str(i)) % 200) - 100
            )
            for i in range(6)
        ]

        income_est = round(yield_est * 10 * current_price)
        ndvi_score = round(ndvi * 55)
        area_score = min(20, round(area_acres * 2.5))
        income_score = min(25, round(income_est / 50000))
        score = max(22, min(96, ndvi_score + area_score + income_score))
        loan_amount = round((income_est * 0.65) / 1000) * 1000

        result = json.dumps({
            "score": score,
            "ndvi": round(ndvi, 3),
            "yieldEstTonnes": yield_est,
            "incomeEst": income_est,
            "loanAmount": loan_amount,
            "priceTrend": price_trend,
            "cropClassified": crop,
            "district": district
        })

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(result.encode()) 
