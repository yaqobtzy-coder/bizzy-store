// ========================================
// FIREBASE CONFIGURATION
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyBUHSGJ2Yaet7ue1x8WLcHn6LI627SINqg",
    authDomain: "rayy-digital-store.firebaseapp.com",
    databaseURL: "https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rayy-digital-store",
    storageBucket: "rayy-digital-store.firebasestorage.app",
    messagingSenderId: "537690791174",
    appId: "1:537690791174:web:c29f7cdfcae0506b6e1287"
};

// ========================================
// PAYMENT GATEWAYS
// ========================================
const PAYMENT_GATEWAYS = {
    zakki: {
        name: "Zakki Store QRIS",
        url: "https://qris.zakki.store",
        token: "c7f15169bcfd61",
        recommended: true
    },
    ramashop: {
        name: "Ramashop QRIS",
        url: "https://ramashop.my.id/api/public",
        token: "rg_fb3d84af5d92b8c09f3b2194e870db",
        recommended: false
    }
};

// ========================================
// IMGBB API
// ========================================
const IMGBB_API_KEY = "a60507c67d4d1a5d3f6b0cecbb168314";

// ========================================
// WHATSAPP NUMBERS
// ========================================
const WHATSAPP_NUMBER = "6285794545996";
const WHATSAPP_ADMIN2 = "6285189712417";

// ========================================
// TELEGRAM BOT
// ========================================
const TELEGRAM_BOT_TOKEN = "8996706964:AAEXwbGDvtJC3l2X6WTeFfk3K5KZb7JxtLQ";
const TELEGRAM_CHAT_ID = "7966336512";

// ========================================
// INITIALIZE FIREBASE
// ========================================
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ========================================
// CONTACT INFO
// ========================================
const CONTACT = {
    email: "rayystore@myruko.web.id",
    whatsapp: "6285794545996",
    telegram: "@DeltaxReal",
    tiktok: "@r_itsmyinitials",
    instagram: "@rayystore"
};

console.log("✅ Firebase initialized!");
console.log("📧 Email:", CONTACT.email);
console.log("📱 WhatsApp:", CONTACT.whatsapp);
console.log("💬 Telegram:", CONTACT.telegram);
console.log("🎵 TikTok:", CONTACT.tiktok);