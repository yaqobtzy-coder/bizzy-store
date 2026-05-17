// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUHSGJ2Yaet7ue1x8WLcHn6LI627SINqg",
    authDomain: "rayy-digital-store.firebaseapp.com",
    databaseURL: "https://rayy-digital-store-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rayy-digital-store",
    storageBucket: "rayy-digital-store.firebasestorage.app",
    messagingSenderId: "537690791174",
    appId: "1:537690791174:web:c29f7cdfcae0506b6e1287"
};

// Payment Gateway Tokens
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

// ImgBB API Key
const IMGBB_API_KEY = "a60507c67d4d1a5d3f6b0cecbb168314";

// WhatsApp Number
const WHATSAPP_NUMBER = "6285794545996";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();