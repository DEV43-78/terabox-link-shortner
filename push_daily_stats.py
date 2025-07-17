import firebase_admin
from firebase_admin import credentials, db
import js2py

# ✅ Load JS dummy data (make sure 'export' keyword is removed in data.js)
with open("data.js", "r", encoding="utf-8") as f:
    js_code = f.read()

# ✅ Evaluate JavaScript to Python
context = js2py.EvalJs()
context.execute(js_code)

# ✅ Convert JS object to Python dictionary
data = context.dummyUserData.to_dict()

# ✅ Load Firebase service account key
cred = credentials.Certificate("serviceAccountKey.json")

# ✅ Initialize Firebase Admin SDK with correct DB URL
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://link-shortner-project-2aed0-default-rtdb.asia-southeast1.firebasedatabase.app"
})

# ✅ Push data under a specific UID
uid = "UID_abc123"
ref = db.reference(f"users/{uid}")
ref.set(data)

print("✅ Data pushed successfully to Firebase!")
