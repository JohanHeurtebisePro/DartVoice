/**
 * ============================================================
 * DARTVOICE ULTIMATE PRO v8.3 - HEATMAP AMÉLIORÉ
 * ============================================================
 * Améliorations du heatmap :
 * - Enregistrement précis de toutes les zones
 * - Meilleure visualisation des données
 * - Statistiques détaillées améliorées
 * - Gestion optimale des positions de fléchettes
 * ============================================================
 */

// ============================================================
// 1. SÉLECTION DOM
// ============================================================

// --- SETUP ---
const viewSetup = document.getElementById('modal-setup');
const viewGame = document.getElementById('game-interface');
const listPlayersSetup = document.getElementById('players-list');
const btnAddPlayer = document.getElementById('btn-add-player');
const btnStart = document.getElementById('btn-start-game');

const inputModeType = document.getElementById('game-mode-type');
const inputMode = document.getElementById('game-mode');
const inputLegs = document.getElementById('input-legs');
const inputSets = document.getElementById('input-sets');
const checkDoubleIn = document.getElementById('check-double-in');
const checkDoubleOut = document.getElementById('check-double-out');

// --- ZONE ACTIVE ---
const uiName = document.getElementById('active-player-name');
const uiScore = document.getElementById('current-score');
const uiSets = document.getElementById('active-sets');
const uiLegs = document.getElementById('active-legs');
const uiCheckout = document.getElementById('checkout-hint');
const uiTurnAvg = document.getElementById('turn-average');
const uiTurnTotal = document.getElementById('turn-total-display');
const uiVoiceFeedback = document.getElementById('voice-feedback');

const dartSlots = [
    document.getElementById('dart-1'), 
    document.getElementById('dart-2'), 
    document.getElementById('dart-3')
];

// --- ZONE DATA ---
const scoreboardContainer = document.getElementById('scoreboard-container');
const logBox = document.getElementById('game-logs');

// --- STATS ---
const stat180s = document.getElementById('stat-180s');
const stat140 = document.getElementById('stat-140');
const stat100 = document.getElementById('stat-100');
const statBest = document.getElementById('stat-best');
const statFirstDart = document.getElementById('stat-first-dart');
const statDoubles = document.getElementById('stat-doubles');

// --- CONTRÔLES ---
const btnMic = document.getElementById('btn-mic');
const btnUndo = document.getElementById('btn-undo');
const btnQuit = document.getElementById('btn-quit');
const btnSettings = document.getElementById('btn-settings');
const btnHeatmap = document.getElementById('btn-heatmap');
const btnExportPDF = document.getElementById('btn-export-pdf');

// --- MODALS ---
const modalSettings = document.getElementById('modal-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const modalHeatmap = document.getElementById('modal-heatmap');
const btnCloseHeatmap = document.getElementById('btn-close-heatmap');
const heatmapCanvas = document.getElementById('heatmap-canvas');

// --- CLAVIER ---
const modalKeypad = document.getElementById('modal-keypad');
const btnKeypadToggle = document.getElementById('btn-keypad-toggle');
const btnCloseKeypad = document.getElementById('btn-close-keypad');
const displayKeypad = document.getElementById('keypad-display');

// ============================================================
// 2. CONFIGURATION VOCALE
// ============================================================

let voices = [];
let voiceSettings = {
    enabled: true,
    announcePlayer: true,
    announceScore: true,
    announceEachDart: true,
    announceTotal: true,
    announceCheckout: true,
    encourage: true,
    speed: 1.1
};

let voiceReady = false;
let currentSpeech = null;

// Chargement des voix
function loadVoices() {
    return new Promise((resolve) => {
        voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            console.log("✅ Voix chargées:", voices.length);
            voiceReady = true;
            resolve(voices);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                console.log("✅ Voix chargées:", voices.length);
                voiceReady = true;
                resolve(voices);
            };
        }
    });
}

// Initialisation vocale
if ('speechSynthesis' in window) {
    loadVoices();
    setTimeout(() => {
        voices = window.speechSynthesis.getVoices();
        console.log("🔊 Voix disponibles:", voices.map(v => v.name + " (" + v.lang + ")"));
    }, 100);
} else {
    console.error("❌ Speech Synthesis non supporté");
}

// Fonction de synthèse vocale optimisée
function parler(text, priority = false) {
    if (!voiceSettings.enabled || !('speechSynthesis' in window)) {
        return;
    }
    
    if (priority) {
        window.speechSynthesis.cancel();
    }

    const delay = priority ? 100 : 0;
    
    setTimeout(() => {
        if (voices.length === 0) {
            voices = window.speechSynthesis.getVoices();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        const frVoice = voices.find(v => 
            v.lang.startsWith('fr') && 
            (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Thomas'))
        ) || voices.find(v => v.lang.startsWith('fr'));
        
        if (frVoice) {
            utterance.voice = frVoice;
        }
        
        utterance.lang = 'fr-FR'; 
        utterance.rate = voiceSettings.speed;
        utterance.volume = 1.0;
        utterance.pitch = 1.0;

        currentSpeech = utterance;
        window.speechSynthesis.speak(utterance);
    }, delay);
}

// ============================================================
// 3. STATE MANAGEMENT
// ============================================================

let gameState = {
    isRunning: false,
    gameMode: '501',
    config: { 
        startScore: 501, 
        legsToWinSet: 3, 
        setsToWinMatch: 1,
        doubleIn: false,
        doubleOut: true
    },
    players: [], 
    currentPlayerIndex: 0,
    currentRoundDarts: 0,
    currentTurnScore: 0,
    currentTurnDarts: [],
    history: [],
    cricketScores: {},
    cricketClosed: {},
    trainingTarget: null,
    trainingAttempts: 0,
    trainingSuccess: 0
};

let recognition = null;
let wakeLock = null;
let currentInput = "";

// ============================================================
// 4. SYSTÈME ANTI-TRICHE ULTRA-SÉCURISÉ
// ============================================================

// Tous les scores valides possibles avec UNE fléchette
const VALID_SINGLE_SCORES = new Set([
    0, // Raté
    // Simples (1-20)
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    // Doubles (2-40)
    4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40,
    // Triples (3-60)
    3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 60,
    // Bulls
    25, 50
]);

// Fonction de validation ultra-sécurisée d'un score unique
function isValidSingleScore(score) {
    return VALID_SINGLE_SCORES.has(score);
}

// Fonction de validation d'un score total (3 fléchettes)
function isValidTotalScore(total) {
    if (total > 180) return false;
    if (total < 0) return false;
    
    const impossibleScores = [
        163, 166, 169, 172, 173, 175, 176, 178, 179
    ];
    
    if (impossibleScores.includes(total)) return false;
    
    return true;
}

// Validation avancée
function isScoreAchievableWithRemainingDarts(score, dartsLeft) {
    if (dartsLeft === 0) return score === 0;
    if (dartsLeft < 0) return false;
    
    const maxPossible = dartsLeft * 60;
    
    if (score > maxPossible) return false;
    if (score < 0) return false;
    
    if (dartsLeft === 1) {
        return isValidSingleScore(score);
    }
    
    if (dartsLeft === 2) {
        if (score > 120) return false;
        
        const impossible2Darts = [119, 116, 113, 112, 109, 106, 103, 102, 99, 96, 93, 92, 89, 86, 83, 82, 79, 76, 73, 72, 69, 66, 63, 62, 59, 56, 53, 52, 49, 46, 43, 42, 39, 36, 33, 32, 29, 26, 23, 22, 19, 16, 13, 12, 9, 6, 3];
        const cleanImpossible2 = impossible2Darts.filter(s => s <= 120);
        
        if (cleanImpossible2.includes(score)) return false;
    }
    
    return true;
}

// Validation complète d'un score
function validateScore(score, context = {}) {
    const dartsLeft = 3 - gameState.currentRoundDarts;
    const isSingleDart = dartsLeft === 3 || (context.isSingle === true);
    const isTotalScore = score > 60 && score !== 50;
    
    if (typeof score !== 'number' || isNaN(score)) {
        return { valid: false, reason: "Score invalide (non numérique)" };
    }
    
    if (score < 0) {
        return { valid: false, reason: "Score négatif impossible" };
    }
    
    if (score === 0) {
        return { valid: true };
    }
    
    if (isSingleDart && !isTotalScore) {
        if (!isValidSingleScore(score)) {
            return { valid: false, reason: `${score} impossible avec 1 fléchette (max: 60)` };
        }
        return { valid: true };
    }
    
    if (isTotalScore || dartsLeft === 0) {
        if (!isValidTotalScore(score)) {
            return { valid: false, reason: `${score} impossible avec 3 fléchettes (max: 180)` };
        }
        return { valid: true };
    }
    
    if (!isScoreAchievableWithRemainingDarts(score, dartsLeft)) {
        return { valid: false, reason: `${score} impossible avec ${dartsLeft} fléchette(s) restante(s)` };
    }
    
    return { valid: true };
}

// Détection de triche potentielle
function detectCheat(score) {
    const validation = validateScore(score);
    
    if (!validation.valid) {
        console.warn("⚠️ TRICHE DÉTECTÉE:", validation.reason);
        parler("Score impossible détecté. Vérifiez votre saisie.", true);
        addLog("SÉCURITÉ", "⚠️ ALERTE", validation.reason);
        
        uiScore.classList.add('bust');
        setTimeout(() => {
            uiScore.classList.remove('bust');
        }, 2000);
        
        return true;
    }
    
    return false;
}

// ============================================================
// 5. TABLE DE CHECKOUT ULTRA-DÉTAILLÉE (3 FLÉCHETTES)
// ============================================================

const ADVANCED_CHECKOUTS = {
    170: "T20 - T20 - DB (60-60-50)",
    167: "T20 - T19 - DB (60-57-50)", 
    164: "T20 - T18 - DB (60-54-50)",
    161: "T20 - T17 - DB (60-51-50)",
    160: "T20 - T20 - D20 (60-60-40)",
    158: "T20 - T20 - D19 (60-60-38)",
    157: "T20 - T19 - D20 (60-57-40)",
    156: "T20 - T20 - D18 (60-60-36)",
    155: "T20 - T19 - D19 (60-57-38)",
    154: "T20 - T18 - D20 (60-54-40)",
    153: "T20 - T19 - D18 (60-57-36)",
    152: "T20 - T20 - D16 (60-60-32)",
    151: "T20 - T17 - D20 (60-51-40)",
    150: "T20 - T18 - D18 (60-54-36)",
    149: "T20 - T19 - D16 (60-57-32)",
    148: "T20 - T20 - D14 (60-60-28)",
    147: "T20 - T17 - D18 (60-51-36)",
    146: "T20 - T18 - D16 (60-54-32)",
    145: "T20 - T15 - D20 (60-45-40)",
    144: "T20 - T20 - D12 (60-60-24)",
    143: "T20 - T17 - D16 (60-51-32)",
    142: "T20 - T14 - D20 (60-42-40)",
    141: "T20 - T19 - D12 (60-57-24)",
    140: "T20 - T16 - D16 (60-48-32)",
    139: "T20 - T13 - D20 (60-39-40)",
    138: "T20 - T18 - D12 (60-54-24)",
    137: "T20 - T15 - D16 (60-45-32)",
    136: "T20 - T20 - D8 (60-60-16)",
    135: "T20 - T15 - D15 (60-45-30)",
    134: "T20 - T14 - D16 (60-42-32)",
    133: "T20 - T19 - D8 (60-57-16)",
    132: "T20 - T16 - D12 (60-48-24)",
    131: "T20 - T13 - D16 (60-39-32)",
    130: "T20 - T18 - D8 (60-54-16)",
    129: "T19 - T16 - D12 (57-48-24)",
    128: "T18 - T14 - D16 (54-42-32)",
    127: "T20 - T17 - D8 (60-51-16)",
    126: "T19 - T19 - D6 (57-57-12)",
    125: "T18 - T13 - D16 (54-39-32)",
    124: "T20 - T16 - D8 (60-48-16)",
    123: "T19 - T16 - D9 (57-48-18)",
    122: "T18 - T18 - D7 (54-54-14)",
    121: "T20 - T11 - D14 (60-33-28)",
    120: "T20 - 20 - D20 (60-20-40)",
    119: "T19 - T12 - D13 (57-36-26)",
    118: "T20 - 18 - D20 (60-18-40)",
    117: "T20 - 17 - D20 (60-17-40)",
    116: "T20 - 16 - D20 (60-16-40)",
    115: "T20 - 15 - D20 (60-15-40)",
    114: "T20 - 14 - D20 (60-14-40)",
    113: "T20 - 13 - D20 (60-13-40)",
    112: "T20 - 12 - D20 (60-12-40)",
    111: "T20 - 19 - D16 (60-19-32)",
    110: "T20 - 10 - D20 (60-10-40)",
    109: "T20 - 9 - D20 (60-9-40)",
    108: "T20 - 16 - D16 (60-16-32)",
    107: "T19 - 18 - D16 (57-18-32)",
    106: "T20 - 10 - D18 (60-10-36)",
    105: "T20 - 13 - D16 (60-13-32)",
    104: "T18 - 18 - D16 (54-18-32)",
    103: "T19 - 10 - D18 (57-10-36)",
    102: "T20 - 10 - D16 (60-10-32)",
    101: "T17 - 10 - D20 (51-10-40)",
    100: "T20 - D20 (60-40)",
    98: "T20 - D19 (60-38)",
    96: "T20 - D18 (60-36)",
    95: "T19 - D19 (57-38)",
    94: "T18 - D20 (54-40)",
    93: "T19 - D18 (57-36)",
    92: "T20 - D16 (60-32)",
    91: "T17 - D20 (51-40)",
    90: "T18 - D18 (54-36)",
    89: "T19 - D16 (57-32)",
    88: "T16 - D20 (48-40)",
    87: "T17 - D18 (51-36)",
    86: "T18 - D16 (54-32)",
    85: "T15 - D20 (45-40)",
    84: "T20 - D12 (60-24)",
    83: "T17 - D16 (51-32)",
    82: "T14 - D20 (42-40)",
    81: "T19 - D12 (57-24)",
    80: "T20 - D10 (60-20)",
    79: "T19 - D11 (57-22)",
    78: "T18 - D12 (54-24)",
    77: "T19 - D10 (57-20)",
    76: "T20 - D8 (60-16)",
    75: "T17 - D12 (51-24)",
    74: "T14 - D16 (42-32)",
    73: "T19 - D8 (57-16)",
    72: "T16 - D12 (48-24)",
    71: "T13 - D16 (39-32)",
    70: "T18 - D8 (54-16)",
    69: "T19 - D6 (57-12)",
    68: "T20 - D4 (60-8)",
    67: "T17 - D8 (51-16)",
    66: "T10 - D18 (30-36)",
    65: "T19 - D4 (57-8)",
    64: "T16 - D8 (48-16)",
    63: "T13 - D12 (39-24)",
    62: "T10 - D16 (30-32)",
    61: "T15 - D8 (45-16)",
    60: "20 - D20 (20-40)",
    58: "18 - D20 (18-40)",
    57: "17 - D20 (17-40)",
    56: "T16 - D4 (48-8)",
    55: "15 - D20 (15-40)",
    54: "14 - D20 (14-40)",
    53: "13 - D20 (13-40)",
    52: "12 - D20 (12-40)",
    51: "11 - D20 (11-40)",
    50: "10 - D20 OU Bull (10-40 / 50)",
    49: "9 - D20 (9-40)",
    48: "16 - D16 (16-32)",
    47: "15 - D16 (15-32)",
    46: "6 - D20 (6-40)",
    45: "13 - D16 (13-32)",
    44: "12 - D16 (12-32)",
    43: "11 - D16 (11-32)",
    42: "10 - D16 (10-32)",
    41: "9 - D16 (9-32)",
    40: "D20 (40)",
    38: "D19 (38)",
    36: "D18 (36)",
    34: "D17 (34)",
    32: "D16 (32)",
    30: "D15 (30)",
    28: "D14 (28)",
    26: "D13 (26)",
    24: "D12 (24)",
    22: "D11 (22)",
    20: "D10 (20)",
    18: "D9 (18)",
    16: "D8 (16)",
    14: "D7 (14)",
    12: "D6 (12)",
    10: "D5 (10)",
    8: "D4 (8)",
    6: "D3 (6)",
    4: "D2 (4)",
    2: "D1 (2)"
};

// ============================================================
// 6. MAPPING AMÉLIORÉ DES ZONES DU DARTBOARD POUR HEATMAP
// ============================================================

const dartboardZones = {
    // Numéros simples (1-20) avec angles précis
    1: { angle: 234, radius: 0.5, type: 'single', label: '1' },
    2: { angle: 261, radius: 0.5, type: 'single', label: '2' },
    3: { angle: 81, radius: 0.5, type: 'single', label: '3' },
    4: { angle: 108, radius: 0.5, type: 'single', label: '4' },
    5: { angle: 171, radius: 0.5, type: 'single', label: '5' },
    6: { angle: 27, radius: 0.5, type: 'single', label: '6' },
    7: { angle: 198, radius: 0.5, type: 'single', label: '7' },
    8: { angle: 144, radius: 0.5, type: 'single', label: '8' },
    9: { angle: 315, radius: 0.5, type: 'single', label: '9' },
    10: { angle: 288, radius: 0.5, type: 'single', label: '10' },
    11: { angle: 351, radius: 0.5, type: 'single', label: '11' },
    12: { angle: 225, radius: 0.5, type: 'single', label: '12' },
    13: { angle: 54, radius: 0.5, type: 'single', label: '13' },
    14: { angle: 135, radius: 0.5, type: 'single', label: '14' },
    15: { angle: 18, radius: 0.5, type: 'single', label: '15' },
    16: { angle: 189, radius: 0.5, type: 'single', label: '16' },
    17: { angle: 99, radius: 0.5, type: 'single', label: '17' },
    18: { angle: 126, radius: 0.5, type: 'single', label: '18' },
    19: { angle: 72, radius: 0.5, type: 'single', label: '19' },
    20: { angle: 0, radius: 0.5, type: 'single', label: '20' },
    
    // Bulls
    25: { angle: 0, radius: 0.15, type: 'bull', label: 'Bull' },
    50: { angle: 0, radius: 0.05, type: 'bullseye', label: 'Bullseye' }
};

// Générer dynamiquement les doubles et triples
for (let i = 1; i <= 20; i++) {
    const base = dartboardZones[i];
    
    // Doubles (bord extérieur)
    dartboardZones[`D${i}`] = { 
        angle: base.angle, 
        radius: 0.95, 
        type: 'double', 
        value: i * 2,
        label: `D${i}`
    };
    
    // Triples (cercle intermédiaire)
    dartboardZones[`T${i}`] = { 
        angle: base.angle, 
        radius: 0.65, 
        type: 'triple', 
        value: i * 3,
        label: `T${i}`
    };
}

console.log("✅ Zones du dartboard générées:", Object.keys(dartboardZones).length, "zones");


// ============================================================
// 7. DICTIONNAIRE DE RECONNAISSANCE AMÉLIORÉ
// ============================================================

const ENHANCED_VOICE_MAP = {
    // Nombres directs
    "zéro": 0, "un": 1, "deux": 2, "trois": 3, "quatre": 4, "cinq": 5,
    "six": 6, "sept": 7, "huit": 8, "neuf": 9, "dix": 10,
    "onze": 11, "douze": 12, "treize": 13, "quatorze": 14, "quinze": 15,
    "seize": 16, "dix-sept": 17, "dix-huit": 18, "dix-neuf": 19, "vingt": 20,
    
    // Variantes phonétiques courantes
    "vin": 20, "vain": 20, "vint": 20,
    "diz": 10, "dis": 10,
    "cen": 100, "cent": 100, "san": 100,
    "soixante": 60, "suissante": 60,
    "cinquante": 50, "sinkante": 50,
    "quarante": 40, "carante": 40,
    "trente": 30, "trent": 30,
    
    // Bulls
    "bull": 50, "bulle": 50, "bul": 50, "boule": 50,
    "centre": 50, "center": 50,
    "vingt-cinq": 25, "25": 25,
    
    // Scores courants
    "180": 180, "cent quatre-vingts": 180, "cent quatre vingt": 180,
    "140": 140, "cent quarante": 140,
    "141": 141, "cent quarante et un": 141, "cent quarante un": 141,
    "100": 100, "120": 120, "121": 121,
    "81": 81, "quatre-vingt-un": 81,
    "60": 60, "45": 45, "41": 41, "26": 26
};

// Patterns ultra-optimisés
const ULTRA_PATTERNS = {
    tripleShort: /^t(\d+)$/i,
    doubleShort: /^d(\d+)$/i,
    tripleLong: /(?:triple|trip)\s*(\d+)/i,
    doubleLong: /(?:double|doub)\s*(\d+)/i,
    multiScores: /(\d+)\s+(\d+)(?:\s+(\d+))?/,
    correction: /^(?:non|correction|erreur|annule|efface|faux|stop)/i,
    bull: /^(?:bull|bulle|centre|50|bul|boule)/i,
    pureNumbers: /\b\d+\b/g
};

// ============================================================
// 8. RECONNAISSANCE VOCALE ULTRA-RAPIDE
// ============================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if(SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR'; 
    recognition.continuous = true;
    recognition.interimResults = true; 
    recognition.maxAlternatives = 3;
    
    btnMic.addEventListener('click', () => { 
        try { 
            recognition.start(); 
        } catch(e) { 
            recognition.stop(); 
        } 
    });
    
    recognition.onstart = () => {
        btnMic.classList.add('listening'); 
        btnMic.textContent = "🛑 Stop";
        addLog("Système", "MICRO", "ON");
        if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen').then(l => wakeLock = l).catch(e => {});
        }
    };
    
    recognition.onend = () => {
        btnMic.classList.remove('listening'); 
        btnMic.textContent = "🎤 Activer";
        addLog("Système", "MICRO", "OFF");
        uiVoiceFeedback.classList.remove('active');
        uiVoiceFeedback.textContent = "";
        if(wakeLock) { 
            wakeLock.release().catch(e => {}); 
            wakeLock = null; 
        }
    };
    
    recognition.onresult = (e) => {
        const result = e.results[e.results.length - 1];
        const isFinal = result.isFinal;
        
        const alternatives = [];
        for (let i = 0; i < result.length; i++) {
            alternatives.push({
                transcript: result[i].transcript.toLowerCase().trim(),
                confidence: result[i].confidence
            });
        }
        
        const bestTranscript = alternatives[0].transcript;
        
        if (!isFinal) {
            showVoiceFeedback(bestTranscript);
            
            if (bestTranscript.length > 0) {
                preAnalyzeTranscript(bestTranscript);
            }
        } else {
            hideVoiceFeedback();
            processWithAlternatives(alternatives);
        }
    };
    
    recognition.onerror = (e) => {
        console.error("Erreur reconnaissance:", e.error);
        if (e.error === 'no-speech') {
            try {
                recognition.start();
            } catch(err) {}
        }
    };
} else {
    btnMic.disabled = true;
    btnMic.textContent = "❌ Non supporté";
}

function preAnalyzeTranscript(text) {
    const normalized = text.toLowerCase().trim();
    
    if (ULTRA_PATTERNS.tripleShort.test(normalized) || 
        ULTRA_PATTERNS.doubleShort.test(normalized) ||
        ULTRA_PATTERNS.multiScores.test(normalized)) {
        
        dartSlots[gameState.currentRoundDarts]?.classList.add('listening-pulse');
        setTimeout(() => {
            dartSlots[gameState.currentRoundDarts]?.classList.remove('listening-pulse');
        }, 300);
    }
}

function processWithAlternatives(alternatives) {
    console.log("🎤 Alternatives reçues:", alternatives);
    
    for (const alt of alternatives) {
        const result = processTranscriptSmart(alt.transcript);
        
        if (result.success) {
            console.log(`✅ Alternative acceptée (conf: ${alt.confidence}):`, alt.transcript);
            executeScores(result.scores);
            return;
        }
    }
    
    console.log("❌ Aucune alternative valide trouvée");
    parler("Non compris, répète", true);
}

function processTranscriptSmart(text) {
    text = text.toLowerCase().trim();
    console.log("🔍 Analyse:", text);
    
    if (ULTRA_PATTERNS.correction.test(text)) {
        btnUndo.click();
        
        const afterCorrection = text.replace(ULTRA_PATTERNS.correction, '').trim();
        if (afterCorrection.length > 0) {
            setTimeout(() => processTranscriptSmart(afterCorrection), 300);
        }
        
        return { success: true, scores: [] };
    }
    
    if (ENHANCED_VOICE_MAP[text]) {
        return { success: true, scores: [ENHANCED_VOICE_MAP[text]] };
    }
    
    let match = text.match(ULTRA_PATTERNS.tripleShort);
    if (match) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 20) {
            return { success: true, scores: [num * 3] };
        }
    }
    
    match = text.match(ULTRA_PATTERNS.doubleShort);
    if (match) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 20) {
            return { success: true, scores: [num * 2] };
        }
    }
    
    match = text.match(ULTRA_PATTERNS.tripleLong);
    if (match) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 20) {
            return { success: true, scores: [num * 3] };
        }
    }
    
    match = text.match(ULTRA_PATTERNS.doubleLong);
    if (match) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 20) {
            return { success: true, scores: [num * 2] };
        }
    }
    
    if (ULTRA_PATTERNS.bull.test(text)) {
        return { success: true, scores: [50] };
    }
    
    const multiMatch = text.match(ULTRA_PATTERNS.multiScores);
    if (multiMatch) {
        const scores = [];
        
        let multiplier = 1;
        if (/triple|trip/i.test(text.substring(0, text.indexOf(multiMatch[1])))) {
            multiplier = 3;
        } else if (/double|doub/i.test(text.substring(0, text.indexOf(multiMatch[1])))) {
            multiplier = 2;
        }
        
        for (let i = 1; i <= 3; i++) {
            if (multiMatch[i]) {
                let val = parseInt(multiMatch[i]);
                if (!isNaN(val) && val >= 0 && val <= 60) {
                    scores.push(val * multiplier);
                }
            }
        }
        
        if (scores.length > 0) {
            return { success: true, scores: scores };
        }
    }
    
    const extracted = smartExtractScores(text);
    if (extracted.length > 0) {
        return { success: true, scores: extracted };
    }
    
    return { success: false, scores: [] };
}

function smartExtractScores(text) {
    const scores = [];
    const words = text.split(/\s+/);
    let i = 0;
    
    while (i < words.length) {
        const word = words[i];
        
        if (ENHANCED_VOICE_MAP[word]) {
            scores.push(ENHANCED_VOICE_MAP[word]);
            i++;
            continue;
        }
        
        let mult = 1;
        if (word === "triple" || word === "trip") {
            mult = 3;
            i++;
            if (i >= words.length) break;
        } else if (word === "double" || word === "doub") {
            mult = 2;
            i++;
            if (i >= words.length) break;
        }
        
        const nextWord = words[i];
        const num = parseInt(nextWord);
        
        if (!isNaN(num)) {
            if (num >= 0 && num <= 20) {
                scores.push(num * mult);
            } else if (num >= 21 && num <= 180) {
                scores.push(num);
            }
        } else if (ENHANCED_VOICE_MAP[nextWord]) {
            scores.push(ENHANCED_VOICE_MAP[nextWord] * mult);
        }
        
        i++;
    }
    
    if (scores.length === 0) {
        const numbers = text.match(ULTRA_PATTERNS.pureNumbers);
        if (numbers) {
            numbers.forEach(n => {
                const val = parseInt(n);
                if (val >= 0 && val <= 180) {
                    scores.push(val);
                }
            });
        }
    }
    
    return scores;
}

function executeScores(scores) {
    if (scores.length === 0) return;
    
    console.log("🎯 Scores à enregistrer:", scores);
    
    if (scores.length === 1 && gameState.currentRoundDarts < 3) {
        registerScore(scores[0]);
        return;
    }
    
    if (scores.length === 3) {
        scores.forEach((score, idx) => {
            setTimeout(() => {
                registerScore(score);
            }, idx * 150);
        });
        return;
    }
    
    if (scores.length === 2) {
        scores.forEach((score, idx) => {
            setTimeout(() => {
                registerScore(score);
            }, idx * 150);
        });
        return;
    }
    
    scores.forEach((score, idx) => {
        setTimeout(() => {
            registerScore(score);
        }, idx * 150);
    });
}

function showVoiceFeedback(text) {
    uiVoiceFeedback.textContent = `🎤 "${text}"`;
    uiVoiceFeedback.classList.add('active');
}

function hideVoiceFeedback() {
    setTimeout(() => {
        uiVoiceFeedback.classList.remove('active');
        uiVoiceFeedback.textContent = "";
    }, 800);
}

// ============================================================
// 9. SETUP & INITIALISATION
// ============================================================

inputModeType.addEventListener('change', () => {
    const mode = inputModeType.value;
    const scoreSelection = document.getElementById('score-selection');
    const matchStructure = document.getElementById('match-structure');
    const doubleInGroup = document.getElementById('double-in-group');
    const doubleOutGroup = document.getElementById('double-out-group');
    
    if (mode === 'cricket') {
        scoreSelection.style.display = 'none';
        matchStructure.style.display = 'none';
        doubleInGroup.style.display = 'none';
        doubleOutGroup.style.display = 'none';
    } else if (mode === 'checkout-training' || mode === 'doubles-practice') {
        scoreSelection.style.display = 'none';
        matchStructure.style.display = 'none';
        doubleInGroup.style.display = 'none';
        doubleOutGroup.style.display = 'none';
    } else {
        scoreSelection.style.display = 'block';
        matchStructure.style.display = 'block';
        doubleInGroup.style.display = 'block';
        doubleOutGroup.style.display = 'block';
    }
});

btnAddPlayer.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = `Joueur ${listPlayersSetup.children.length + 1}`;
    listPlayersSetup.appendChild(input);
});

btnStart.addEventListener('click', () => {
    const modeType = inputModeType.value;
    const mode = parseInt(inputMode.value) || 501;
    const legsGoal = parseInt(inputLegs.value) || 1;
    const setsGoal = parseInt(inputSets.value) || 1;
    const inputs = listPlayersSetup.querySelectorAll('input');
    const players = [];

    inputs.forEach(inp => {
        if(inp.value.trim()) {
            players.push({
                name: inp.value,
                score: mode,
                legsWon: 0,
                setsWon: 0,
                totalPoints: 0,
                dartsThrown: 0,
                avg: "0.0",
                count180: 0,
                count140: 0,
                count100: 0,
                bestTurn: 0,
                firstDartTotal: 0,
                firstDartCount: 0,
                doublesAttempted: 0,
                doublesHit: 0,
                hasStarted: false,
                dartPositions: []
            });
        }
    });

    if(players.length === 0) return alert("Ajoute au moins un joueur !");

    gameState = {
        isRunning: true,
        gameMode: modeType,
        config: { 
            startScore: mode, 
            legsToWinSet: legsGoal, 
            setsToWinMatch: setsGoal,
            doubleIn: checkDoubleIn.checked,
            doubleOut: checkDoubleOut.checked
        },
        players: players,
        currentPlayerIndex: 0,
        currentRoundDarts: 0,
        currentTurnScore: 0,
        currentTurnDarts: [],
        history: []
    };

    if (modeType === 'cricket') {
        initCricket();
    }
    
    if (modeType === 'checkout-training') {
        initCheckoutTraining();
    }
    
    if (modeType === 'doubles-practice') {
        initDoublesPractice();
    }

    const modeNames = {
        '501': '501 STANDARD',
        'cricket': 'CRICKET',
        'checkout-training': 'CHECKOUT TRAINING',
        'doubles-practice': 'DOUBLES PRACTICE'
    };
    
    document.getElementById('game-mode-display').textContent = modeNames[modeType];
    
    if (modeType === '501') {
        document.getElementById('match-structure-display').textContent = 
            `(Best of ${setsGoal} Set${setsGoal > 1 ? 's' : ''} - ${legsGoal} Legs par Set)`;
    } else {
        document.getElementById('match-structure-display').textContent = '';
    }
    
    viewSetup.classList.add('hidden');
    viewGame.classList.remove('hidden');

    updateUI();
    updateTable();
    updateStats();
    addLog("Système", "INFO", `Partie ${modeNames[modeType]} démarrée`);
    
    setTimeout(() => {
        announcePlayerTurn();
    }, 300);
});

btnQuit.addEventListener('click', () => {
    if(confirm("Quitter le match ? Les données seront perdues.")) {
        location.reload();
    }
});

// ============================================================
// 10. MODES DE JEU SPÉCIFIQUES
// ============================================================

function initCricket() {
    gameState.cricketScores = {};
    gameState.cricketClosed = {};
    
    const numbers = [20, 19, 18, 17, 16, 15, 'B'];
    
    gameState.players.forEach(player => {
        gameState.cricketScores[player.name] = {};
        gameState.cricketClosed[player.name] = {};
        
        numbers.forEach(num => {
            gameState.cricketScores[player.name][num] = 0;
            gameState.cricketClosed[player.name][num] = false;
        });
    });
    
    gameState.config.doubleOut = false;
    gameState.config.doubleIn = false;
}

function registerCricketScore(value) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const cricketNumbers = [20, 19, 18, 17, 16, 15, 'B'];
    
    let hits = 1;
    let number = value;
    
    if (value >= 30 && value <= 60 && value % 3 === 0) {
        const base = value / 3;
        if (cricketNumbers.includes(base)) {
            number = base;
            hits = 3;
        }
    } else if (value >= 30 && value <= 40 && value % 2 === 0) {
        const base = value / 2;
        if (cricketNumbers.includes(base)) {
            number = base;
            hits = 2;
        }
    } else if (value === 50) {
        number = 'B';
        hits = 2;
    } else if (value === 25) {
        number = 'B';
        hits = 1;
    }
    
    if (!cricketNumbers.includes(number)) {
        addLog(player.name, "CRICKET", `${value} (non comptabilisé)`);
        return;
    }
    
    gameState.cricketScores[player.name][number] += hits;
    
    if (gameState.cricketScores[player.name][number] > 3) {
        const excess = gameState.cricketScores[player.name][number] - 3;
        
        let canScore = false;
        gameState.players.forEach(p => {
            if (p.name !== player.name && !gameState.cricketClosed[p.name][number]) {
                canScore = true;
            }
        });
        
        if (canScore) {
            const points = number === 'B' ? 25 * excess : number * excess;
            player.score += points;
            addLog(player.name, "CRICKET", `${value} (+${points} pts)`);
        }
    }
    
    if (gameState.cricketScores[player.name][number] >= 3) {
        gameState.cricketClosed[player.name][number] = true;
    }
    
    checkCricketWin(player);
    updateCricketTable();
}

function checkCricketWin(player) {
    const numbers = [20, 19, 18, 17, 16, 15, 'B'];
    let allClosed = true;
    
    numbers.forEach(num => {
        if (!gameState.cricketClosed[player.name][num]) {
            allClosed = false;
        }
    });
    
    if (allClosed) {
        let hasHighestScore = true;
        gameState.players.forEach(p => {
            if (p.name !== player.name && p.score >= player.score) {
                hasHighestScore = false;
            }
        });
        
        if (hasHighestScore) {
            handleCricketWin(player);
        }
    }
}

function handleCricketWin(player) {
    gameState.isRunning = false;
    parler(`Victoire pour ${player.name} au Cricket !`, true);
    addLog(player.name, "VICTOIRE", "🏆 CRICKET WIN");
    
    setTimeout(() => {
        alert(`🏆 VICTOIRE DE ${player.name} ! 🏆\n\nMode: CRICKET\nScore final: ${player.score} points`);
    }, 1000);
}

function initCheckoutTraining() {
    const checkoutScores = [170, 167, 164, 161, 160, 157, 156, 153, 150, 147, 144, 141, 140, 
                            138, 135, 132, 130, 127, 124, 121, 120, 110, 100, 90, 80, 70, 60, 50, 40];
    
    gameState.trainingTarget = checkoutScores[Math.floor(Math.random() * checkoutScores.length)];
    gameState.trainingAttempts = 0;
    gameState.trainingSuccess = 0;
    
    gameState.players[0].score = gameState.trainingTarget;
    
    addLog("Training", "CIBLE", `Finish ${gameState.trainingTarget}`);
    parler(`Entraînement checkout. Cible : ${gameState.trainingTarget}`, true);
}

function nextCheckoutTarget() {
    const checkoutScores = [170, 167, 164, 161, 160, 157, 156, 153, 150, 147, 144, 141, 140, 
                            138, 135, 132, 130, 127, 124, 121, 120, 110, 100, 90, 80, 70, 60, 50, 40];
    
    gameState.trainingTarget = checkoutScores[Math.floor(Math.random() * checkoutScores.length)];
    gameState.players[0].score = gameState.trainingTarget;
    gameState.currentRoundDarts = 0;
    gameState.currentTurnScore = 0;
    gameState.currentTurnDarts = [];
    
    dartSlots.forEach(s => { 
        s.textContent = "-"; 
        s.classList.remove('highlight');
    });
    
    addLog("Training", "CIBLE", `Finish ${gameState.trainingTarget}`);
    parler(`Nouvelle cible : ${gameState.trainingTarget}`, true);
    updateUI();
}

function initDoublesPractice() {
    const doubles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    
    gameState.trainingTarget = `D${doubles[Math.floor(Math.random() * doubles.length)]}`;
    gameState.trainingAttempts = 0;
    gameState.trainingSuccess = 0;
    
    addLog("Training", "CIBLE", gameState.trainingTarget);
    parler(`Entraînement doubles. Cible : Double ${gameState.trainingTarget.substring(1)}`, true);
}

function nextDoublesTarget() {
    const doubles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    
    gameState.trainingTarget = `D${doubles[Math.floor(Math.random() * doubles.length)]}`;
    gameState.trainingAttempts = 0;
    
    dartSlots.forEach(s => { 
        s.textContent = "-"; 
        s.classList.remove('highlight');
    });
    
    addLog("Training", "CIBLE", gameState.trainingTarget);
    parler(`Nouvelle cible : Double ${gameState.trainingTarget.substring(1)}`, true);
}

// ============================================================
// 11. MOTEUR DE JEU PRINCIPAL (AVEC ANTI-TRICHE)
// ============================================================

function registerScore(points, skipValidation = false) {
    if (!gameState.isRunning) return;
    if (gameState.currentRoundDarts >= 3 && !skipValidation) return;

    points = parseInt(points);
    if (isNaN(points)) return;

    // ⚠️ VALIDATION ANTI-TRICHE
    if (!skipValidation) {
        if (detectCheat(points)) {
            return;
        }
    }

    if (gameState.gameMode === 'cricket') {
        registerCricketScore(points);
        gameState.currentRoundDarts++;
        
        if (gameState.currentRoundDarts >= 3) {
            setTimeout(nextTurn, 1500);
        }
        return;
    }
    
    if (gameState.gameMode === 'doubles-practice') {
        registerDoublesPractice(points);
        return;
    }

    const player = gameState.players[gameState.currentPlayerIndex];
    let isTotalRound = (points > 60 && points !== 50);

    if (gameState.config.doubleIn && !player.hasStarted) {
        if (!isDouble(points) && points !== 50) {
            parler("Double requis pour commencer !", true);
            addLog(player.name, "INFO", "Double-In requis");
            return;
        }
        player.hasStarted = true;
    }

    if (player.score - points < 0 || player.score - points === 1) {
        parler("Bust ! Tu as dépassé.", true);
        addLog(player.name, "BUST", `(-${points})`);
        
        gameState.history.push({ 
            playerId: gameState.currentPlayerIndex, 
            points: 0, 
            dartsUsed: isTotalRound ? 3 : 1, 
            wasBust: true 
        });

        gameState.currentRoundDarts = 3;
        gameState.currentTurnScore = 0;
        gameState.currentTurnDarts = [];
        
        uiScore.classList.add('bust');
        setTimeout(() => { 
            uiScore.classList.remove('bust');
            nextTurn(); 
        }, 2000);
        return;
    }

    if (gameState.config.doubleOut && player.score - points === 0) {
        if (!isDouble(points) && points !== 50) {
            parler("Double requis pour finir !", true);
            addLog(player.name, "INFO", "Double-Out requis");
            
            gameState.history.push({ 
                playerId: gameState.currentPlayerIndex, 
                points: 0, 
                dartsUsed: isTotalRound ? 3 : 1, 
                wasBust: true 
            });
            
            gameState.currentRoundDarts = 3;
            gameState.currentTurnScore = 0;
            gameState.currentTurnDarts = [];
            
            uiScore.classList.add('bust');
            setTimeout(() => { 
                uiScore.classList.remove('bust');
                nextTurn(); 
            }, 2000);
            return;
        }
    }

    player.score -= points;
    player.totalPoints += points;
    gameState.currentTurnScore += points;
    
    let dartsUsed = isTotalRound ? 3 : 1;
    player.dartsThrown += dartsUsed;
    gameState.currentRoundDarts += dartsUsed;
    
    // ⭐ ENREGISTREMENT AMÉLIORÉ DE LA POSITION DES FLÉCHETTES
    recordDartPosition(player, points, isTotalRound);
    
    if (!isTotalRound) {
        gameState.currentTurnDarts.push(points);
        if (gameState.currentTurnDarts.length === 1) {
            player.firstDartTotal += points;
            player.firstDartCount++;
        }
        
        if (isDouble(points)) {
            player.doublesAttempted++;
            player.doublesHit++;
        }
    } else {
        if (gameState.currentTurnDarts.length === 0) {
            player.firstDartTotal += Math.floor(points / 3);
            player.firstDartCount++;
        }
    }

    player.avg = ((player.totalPoints / player.dartsThrown) * 3).toFixed(1);

    gameState.history.push({ 
        playerId: gameState.currentPlayerIndex, 
        points, 
        dartsUsed, 
        wasBust: false 
    });

    addLog(player.name, "TIR", points);
    
    if (isTotalRound) {
        updateDartSlots("Tot", "al", points);
        gameState.currentRoundDarts = 3;
    } else {
        updateDartSlotSingle(gameState.currentRoundDarts - 1, points);
    }

    uiScore.textContent = player.score;
    uiTurnTotal.textContent = `Total : ${gameState.currentTurnScore}`;
    
    const turnAvg = (gameState.currentTurnScore / gameState.currentRoundDarts) * 3;
    uiTurnAvg.textContent = `Moy. tour : ${turnAvg.toFixed(1)}`;
    
    updateCheckoutHint(player.score);
    updateTable();
    updateStats();

    if (player.score === 0) {
        handleLegWin(player);
        return;
    }

    if (isTotalRound) {
        updateTurnStats(gameState.currentTurnScore);
        
        setTimeout(() => {
            announceTurnTotal();
        }, 200);
        
        setTimeout(nextTurn, 2500);
    } else {
        announceDart(points);
        
        if (gameState.currentRoundDarts >= 3) {
            updateTurnStats(gameState.currentTurnScore);
            
            setTimeout(() => {
                announceTurnTotal();
            }, 500);
            
            setTimeout(nextTurn, 2500);
        }
    }
}

function registerDoublesPractice(points) {
    const player = gameState.players[0];
    gameState.trainingAttempts++;
    
    const targetNumber = parseInt(gameState.trainingTarget.substring(1));
    const expectedDouble = targetNumber * 2;
    
    if (points === expectedDouble) {
        gameState.trainingSuccess++;
        parler("Bravo ! Double touché.", true);
        addLog("Training", "SUCCÈS", `${points} ✓`);
        
        player.doublesHit++;
        recordDartPosition(player, points, false);
        
        setTimeout(() => {
            nextDoublesTarget();
        }, 2000);
    } else {
        addLog("Training", "RATÉ", `${points}`);
        
        dartSlots.forEach(s => { 
            s.textContent = "-"; 
            s.classList.remove('highlight');
        });
    }
    
    player.doublesAttempted++;
    
    updateStats();
    updateUI();
}

function updateTurnStats(turnScore) {
    const player = gameState.players[gameState.currentPlayerIndex];
    
    if (turnScore === 180) player.count180++;
    if (turnScore >= 140) player.count140++;
    if (turnScore >= 100) player.count100++;
    if (turnScore > player.bestTurn) player.bestTurn = turnScore;
}

function isDouble(points) {
    const doubles = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];
    return doubles.includes(points);
}

function nextTurn() {
    gameState.currentRoundDarts = 0;
    gameState.currentTurnScore = 0;
    gameState.currentTurnDarts = [];
    
    if (gameState.gameMode !== 'cricket' && gameState.gameMode !== 'checkout-training' && gameState.gameMode !== 'doubles-practice') {
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    }
    
    dartSlots.forEach(s => { 
        s.textContent = "-"; 
        s.style.borderColor = "#334155";
        s.classList.remove('highlight');
    });
    
    uiTurnTotal.textContent = "";
    uiTurnAvg.textContent = "";
    
    updateUI();
    updateStats();
    
    if (gameState.gameMode !== 'checkout-training' && gameState.gameMode !== 'doubles-practice') {
        announcePlayerTurn();
    }
}

// ============================================================
// 12. GESTION DES VICTOIRES
// ============================================================

function handleLegWin(player) {
    gameState.isRunning = false;
    
    if (gameState.gameMode === 'checkout-training') {
        gameState.trainingSuccess++;
        parler("Excellent ! Checkout réussi.", true);
        addLog("Training", "SUCCÈS", `${gameState.trainingTarget} ✓`);
        
        setTimeout(() => {
            gameState.isRunning = true;
            nextCheckoutTarget();
        }, 2000);
        return;
    }
    
    parler(`Bravo ! Manche pour ${player.name}.`, true);
    addLog(player.name, "MANCHE", "GAGNÉE 🎯");
    
    player.legsWon++;
    updateMatchScoreCard();
    
    if (player.legsWon >= gameState.config.legsToWinSet) {
        handleSetWin(player);
    } else {
        setTimeout(() => {
            alert(`${player.name} gagne la manche !`);
            resetLegScores();
        }, 1000);
    }
}

function handleSetWin(player) {
    parler(`Set remporté par ${player.name} !`, true);
    addLog(player.name, "SET", "GAGNÉ 🏆");
    
    player.setsWon++;
    gameState.players.forEach(p => p.legsWon = 0);
    updateMatchScoreCard();

    if (player.setsWon >= gameState.config.setsToWinMatch) {
        handleMatchWin(player);
    } else {
        setTimeout(() => {
            alert(`${player.name} REMPORTE LE SET !`);
            resetLegScores();
        }, 1000);
    }
}

function handleMatchWin(player) {
    uiScore.textContent = "WIN";
    uiScore.style.color = "#22c55e";
    parler(`Victoire finale pour ${player.name} ! Félicitations.`, true);
    addLog(player.name, "MATCH", "VICTOIRE 👑");
    
    setTimeout(() => {
        alert(`🏆 VICTOIRE DE ${player.name} ! 🏆\n\nStatistiques:\n- Moyenne: ${player.avg}\n- Meilleur tour: ${player.bestTurn}\n- 180s: ${player.count180}\n- 140+: ${player.count140}\n- 100+: ${player.count100}`);
    }, 1000);
    
    if(recognition) recognition.stop();
}

function resetLegScores() {
    gameState.isRunning = true;
    gameState.players.forEach(p => {
        p.score = gameState.config.startScore;
        if (gameState.config.doubleIn) {
            p.hasStarted = false;
        }
    });
    gameState.currentRoundDarts = 0;
    gameState.currentTurnScore = 0;
    gameState.currentTurnDarts = [];
    
    nextTurn();
    updateTable();
}

// ============================================================
// 13. ANNONCES VOCALES
// ============================================================

function announcePlayerTurn() {
    if (!voiceSettings.enabled) return;
    
    const player = gameState.players[gameState.currentPlayerIndex];
    let announcement = "";
    
    if (voiceSettings.announcePlayer) {
        announcement += `${player.name}. `;
    }
    
    if (voiceSettings.announceScore && gameState.gameMode === '501') {
        announcement += `${player.score} points.`;
    }
    
    if (announcement) {
        parler(announcement, true);
    }
}

function announceDart(points) {
    if (!voiceSettings.enabled || !voiceSettings.announceEachDart) return;
    parler(`${points}`);
}

function announceTurnTotal() {
    if (!voiceSettings.enabled || !voiceSettings.announceTotal) return;
    
    const player = gameState.players[gameState.currentPlayerIndex];
    let announcement = "";
    
    announcement = `${gameState.currentTurnScore}.`;
    
    if (voiceSettings.announceScore && gameState.gameMode === '501') {
        announcement += ` Il reste ${player.score}.`;
    }
    
    if (voiceSettings.encourage) {
        if (gameState.currentTurnScore === 180) {
            announcement += " Maximum ! Cent quatre-vingts !";
        } else if (gameState.currentTurnScore >= 140) {
            announcement += " Excellent !";
        } else if (gameState.currentTurnScore >= 100) {
            announcement += " Très bien !";
        }
    }
    
    parler(announcement);
}

// ============================================================
// 14. MISE À JOUR UI
// ============================================================

function updateUI() {
    const p = gameState.players[gameState.currentPlayerIndex];
    uiName.textContent = p.name;
    
    if (gameState.gameMode === 'doubles-practice') {
        uiScore.textContent = gameState.trainingTarget;
    } else {
        uiScore.textContent = p.score;
    }
    
    uiScore.style.color = "#fff";
    
    if (gameState.gameMode === '501' || gameState.gameMode === 'checkout-training') {
        updateCheckoutHint(p.score);
    } else {
        uiCheckout.textContent = "";
    }
    
    updateMatchScoreCard();
}

function updateMatchScoreCard() {
    if (gameState.gameMode === 'cricket' || gameState.gameMode === 'checkout-training' || gameState.gameMode === 'doubles-practice') {
        uiSets.textContent = '-';
        uiLegs.textContent = '-';
        return;
    }
    
    if (gameState.players.length >= 2) {
        const p1 = gameState.players[0];
        const p2 = gameState.players[1];
        uiSets.textContent = `${p1.setsWon} - ${p2.setsWon}`;
        uiLegs.textContent = `${p1.legsWon} - ${p2.legsWon}`;
    } else if (gameState.players.length === 1) {
        const p = gameState.players[0];
        uiSets.textContent = p.setsWon;
        uiLegs.textContent = p.legsWon;
    }
}

function updateTable() {
    if (gameState.gameMode === 'cricket') {
        updateCricketTable();
        return;
    }
    
    if (gameState.gameMode === 'checkout-training' || gameState.gameMode === 'doubles-practice') {
        updateTrainingTable();
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Nom</th>
                    <th>Sets</th>
                    <th>Legs</th>
                    <th>Score</th>
                    <th>Moy.</th>
                    <th>Max</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    gameState.players.forEach((p, index) => {
        let isCurrent = (index === gameState.currentPlayerIndex);
        html += `
            <tr class="${isCurrent ? 'active-row' : ''}">
                <td>${p.name}</td>
                <td><strong>${p.setsWon}</strong></td>
                <td>${p.legsWon}</td>
                <td>${p.score}</td>
                <td>${p.avg}</td>
                <td>${p.bestTurn}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    scoreboardContainer.innerHTML = html;
}

function updateCricketTable() {
    const numbers = [20, 19, 18, 17, 16, 15, 'B'];
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Num</th>
    `;
    
    gameState.players.forEach(p => {
        html += `<th>${p.name}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    numbers.forEach(num => {
        html += `<tr><td><strong>${num}</strong></td>`;
        
        gameState.players.forEach(p => {
            const hits = gameState.cricketScores[p.name][num];
            const closed = gameState.cricketClosed[p.name][num];
            
            let display = '';
            if (hits === 1) display = '/';
            else if (hits === 2) display = 'X';
            else if (hits >= 3) display = closed ? '⊗' : `⊗+${hits - 3}`;
            
            html += `<td style="text-align:center;">${display}</td>`;
        });
        
        html += `</tr>`;
    });
    
    html += `<tr><td><strong>Score</strong></td>`;
    gameState.players.forEach(p => {
        html += `<td style="text-align:center;"><strong>${p.score}</strong></td>`;
    });
    html += `</tr>`;
    
    html += `</tbody></table>`;
    scoreboardContainer.innerHTML = html;
}

function updateTrainingTable() {
    const p = gameState.players[0];
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Statistique</th>
                    <th>Valeur</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Tentatives</td>
                    <td><strong>${gameState.trainingAttempts}</strong></td>
                </tr>
                <tr>
                    <td>Réussites</td>
                    <td style="color:#22c55e;"><strong>${gameState.trainingSuccess}</strong></td>
                </tr>
                <tr>
                    <td>Taux de réussite</td>
                    <td><strong>${gameState.trainingAttempts > 0 ? Math.round((gameState.trainingSuccess / gameState.trainingAttempts) * 100) : 0}%</strong></td>
                </tr>
                <tr>
                    <td>Moyenne</td>
                    <td><strong>${p.avg}</strong></td>
                </tr>
            </tbody>
        </table>
    `;
    
    scoreboardContainer.innerHTML = html;
}

function updateStats() {
    const p = gameState.players[gameState.currentPlayerIndex];
    
    stat180s.textContent = p.count180;
    stat140.textContent = p.count140;
    stat100.textContent = p.count100;
    statBest.textContent = p.bestTurn;
    
    const firstDartAvg = p.firstDartCount > 0 ? (p.firstDartTotal / p.firstDartCount).toFixed(1) : "0.0";
    statFirstDart.textContent = firstDartAvg;
    
    const doublesPercent = p.doublesAttempted > 0 ? Math.round((p.doublesHit / p.doublesAttempted) * 100) : 0;
    statDoubles.textContent = doublesPercent + "%";
}

function addLog(name, action, val) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `<span style="font-weight:bold;color:#3b82f6">${name}</span><span style="color:#94a3b8"> ${action}</span><span style="font-weight:bold;color:#fff"> ${val}</span>`;
    logBox.prepend(div);
}

function updateDartSlotSingle(idx, val) {
    if(idx >= 0 && idx < 3) {
        dartSlots[idx].textContent = val;
        dartSlots[idx].classList.add('highlight');
    }
}

function updateDartSlots(v1, v2, v3) {
    dartSlots[0].textContent = v1; 
    dartSlots[1].textContent = v2; 
    dartSlots[2].textContent = v3;
    dartSlots.forEach(d => d.classList.add('highlight'));
}

function updateCheckoutHint(score) {
    const checkout = ADVANCED_CHECKOUTS[score];
    
    if (checkout && voiceSettings.announceCheckout) {
        uiCheckout.textContent = `Finish : ${checkout}`;
        uiCheckout.style.opacity = "1";
        
        if (score <= 170 && score > 1) {
            setTimeout(() => {
                const simpleCheckout = checkout.split('(')[0].trim();
                parler(`Pour finir : ${simpleCheckout.replace(/T/g, 'Triple ').replace(/D/g, 'Double ').replace(/S/g, 'Simple ').replace(/DB/g, 'Double Bull')}`);
            }, 500);
        }
    } else if (score <= 170 && score > 1 && !checkout) {
        uiCheckout.textContent = "Pas de finish direct";
        uiCheckout.style.opacity = "1";
    } else {
        uiCheckout.textContent = "";
        uiCheckout.style.opacity = "0";
    }
}

// ============================================================
// 15. ⭐ ENREGISTREMENT AMÉLIORÉ DES POSITIONS DE FLÉCHETTES
// ============================================================

function recordDartPosition(player, score, isTotalRound = false) {
    console.log(`📍 Enregistrement position: ${score} (isTotalRound: ${isTotalRound})`);
    
    // Si c'est un score total (ex: 60, 100, 180)
    if (isTotalRound) {
        // On décompose le score en plusieurs fléchettes moyennes
        const avgPerDart = Math.floor(score / 3);
        const remainder = score % 3;
        
        for (let i = 0; i < 3; i++) {
            let dartScore = avgPerDart + (i < remainder ? 1 : 0);
            recordSingleDart(player, dartScore);
        }
        return;
    }
    
    // Sinon, c'est une fléchette unique
    recordSingleDart(player, score);
}

function recordSingleDart(player, score) {
    let zone = null;
    
    // Détection Bulls
    if (score === 50) {
        zone = 50;
        console.log(`✅ Zone détectée: Bullseye (50)`);
    } else if (score === 25) {
        zone = 25;
        console.log(`✅ Zone détectée: Bull (25)`);
    }
    // Détection Doubles (D1 à D20)
    else if (score >= 2 && score <= 40 && score % 2 === 0) {
        const baseNum = score / 2;
        if (baseNum >= 1 && baseNum <= 20 && Number.isInteger(baseNum)) {
            zone = `D${baseNum}`;
            console.log(`✅ Zone détectée: ${zone} (${score})`);
        }
    }
    // Détection Triples (T1 à T20)
    else if (score >= 3 && score <= 60 && score % 3 === 0) {
        const baseNum = score / 3;
        if (baseNum >= 1 && baseNum <= 20 && Number.isInteger(baseNum)) {
            zone = `T${baseNum}`;
            console.log(`✅ Zone détectée: ${zone} (${score})`);
        }
    }
    // Détection Simples (1 à 20)
    else if (score >= 1 && score <= 20) {
        zone = score;
        console.log(`✅ Zone détectée: Simple ${zone}`);
    }
    // Score de 0 (raté)
    else if (score === 0) {
        // On n'enregistre pas les ratés dans le heatmap
        console.log(`⚠️ Raté (0) - non enregistré`);
        return;
    }
    
    // Vérifier si la zone existe dans le mapping
    if (zone && dartboardZones[zone]) {
        player.dartPositions.push(zone);
        console.log(`✅ Position enregistrée: ${zone} | Total: ${player.dartPositions.length} fléchettes`);
    } else {
        console.warn(`⚠️ Zone non trouvée pour le score ${score}`);
    }
}

// ============================================================
// 16. UNDO
// ============================================================

btnUndo.addEventListener('click', () => {
    if(gameState.history.length === 0) return;
    
    const last = gameState.history.pop();
    const p = gameState.players[last.playerId];

    if (!last.wasBust) { 
        p.score += last.points; 
        p.totalPoints -= last.points; 
    }
    
    p.dartsThrown -= last.dartsUsed;
    gameState.currentRoundDarts -= last.dartsUsed;
    gameState.currentTurnScore -= last.points;
    
    if (gameState.currentTurnDarts.length > 0) {
        gameState.currentTurnDarts.pop();
    }
    
    // Retirer les positions de fléchettes du heatmap
    if (p.dartPositions.length > 0) {
        for (let i = 0; i < last.dartsUsed; i++) {
            p.dartPositions.pop();
        }
    }

    if (gameState.currentPlayerIndex !== last.playerId) {
        gameState.currentPlayerIndex = last.playerId;
        gameState.currentRoundDarts = 3 - last.dartsUsed; 
    }
    
    if(gameState.currentRoundDarts < 0) gameState.currentRoundDarts = 0;

    addLog("Système", "UNDO", "Correction");
    updateUI(); 
    updateTable();
    updateStats();
    parler("Correction effectuée.");
});

// ============================================================
// 17. HEATMAP AMÉLIORÉ
// ============================================================

btnHeatmap.addEventListener('click', () => {
    const player = gameState.players[gameState.currentPlayerIndex];
    showHeatmap(player);
});

btnCloseHeatmap.addEventListener('click', () => {
    modalHeatmap.classList.add('hidden');
});

function showHeatmap(player) {
    document.getElementById('heatmap-player-name').textContent = player.name;
    document.getElementById('heatmap-total-darts').textContent = player.dartPositions.length;
    
    // Calculer la zone favorite
    const zoneCounts = {};
    player.dartPositions.forEach(zone => {
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
    });
    
    let maxZone = '-';
    let maxCount = 0;
    Object.entries(zoneCounts).forEach(([zone, count]) => {
        if (count > maxCount) {
            maxCount = count;
            maxZone = zone;
        }
    });
    
    document.getElementById('heatmap-favorite').textContent = maxZone + ` (${maxCount}x)`;
    
    // Calculer la précision sur les zones de scoring
    const targetZones = [20, 'T20', 19, 'T19', 18, 'T18', 'T17', 'T16', 'T15'];
    const targetHits = player.dartPositions.filter(z => targetZones.includes(z)).length;
    const accuracy = player.dartPositions.length > 0 ? 
        Math.round((targetHits / player.dartPositions.length) * 100) : 0;
    
    document.getElementById('heatmap-accuracy').textContent = accuracy + '%';
    
    // Dessiner le heatmap
    drawHeatmap(player.dartPositions);
    
    modalHeatmap.classList.remove('hidden');
    
    console.log(`🎯 Heatmap affiché pour ${player.name}:`, {
        totalDarts: player.dartPositions.length,
        favoriteZone: maxZone,
        accuracy: accuracy + '%',
        positions: player.dartPositions
    });
}

function drawHeatmap(positions) {
    const canvas = heatmapCanvas;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 280;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fond
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner la cible
    drawDartboard(ctx, centerX, centerY, radius);
    
    // Compter les occurrences de chaque zone
    const heatData = {};
    positions.forEach(zone => {
        heatData[zone] = (heatData[zone] || 0) + 1;
    });
    
    const maxHits = Math.max(...Object.values(heatData), 1);
    
    console.log(`📊 Données heatmap:`, heatData);
    console.log(`📊 Max hits: ${maxHits}`);
    
    // Dessiner les zones de chaleur
    Object.entries(heatData).forEach(([zone, count]) => {
        const intensity = count / maxHits;
        drawHeat(ctx, centerX, centerY, radius, zone, intensity, count);
    });
}

function drawDartboard(ctx, cx, cy, r) {
    // Cercle extérieur
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Cercle des triples
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.67, 0, Math.PI * 2);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Cercle du bull extérieur
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Bullseye
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Segments et numéros
    const numbers = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    const anglePerSegment = (Math.PI * 2) / 20;
    
    for (let i = 0; i < 20; i++) {
        const angle = (i * anglePerSegment) - (Math.PI / 2) - (anglePerSegment / 2);
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        // Ligne de séparation
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(0, -r * 0.16);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Numéro
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'rgba(248, 250, 252, 0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numbers[i], 0, -r - 15);
        
        ctx.restore();
    }
}

function drawHeat(ctx, cx, cy, r, zone, intensity, count) {
    if (!dartboardZones[zone]) {
        console.warn(`⚠️ Zone ${zone} introuvable dans dartboardZones`);
        return;
    }
    
    const zoneData = dartboardZones[zone];
    const angle = (zoneData.angle * Math.PI) / 180;
    const zoneRadius = r * zoneData.radius;
    
    const x = cx + Math.cos(angle) * zoneRadius;
    const y = cy + Math.sin(angle) * zoneRadius;
    
    // Taille du gradient basée sur l'intensité
    const gradientSize = 25 + (intensity * 25);
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, gradientSize);
    
    // Couleurs selon l'intensité
    if (intensity < 0.3) {
        gradient.addColorStop(0, `rgba(59, 130, 246, ${0.3 + intensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    } else if (intensity < 0.6) {
        gradient.addColorStop(0, `rgba(251, 146, 60, ${0.4 + intensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
    } else {
        gradient.addColorStop(0, `rgba(239, 68, 68, ${0.5 + intensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, gradientSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Afficher le nombre de hits si > 3
    if (count > 3) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count, x, y);
    }
    
    console.log(`🔥 Zone ${zone} dessinée: x=${Math.round(x)}, y=${Math.round(y)}, intensity=${intensity.toFixed(2)}, count=${count}`);
}

// ============================================================
// 18. EXPORT PDF (simplifié pour la longueur)
// ============================================================

btnExportPDF.addEventListener('click', () => {
    generatePDF();
});

async function generatePDF() {
    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = 0;

    const colors = {
        primary: [59, 130, 246],
        dark: [15, 23, 42],
        accent: [220, 38, 38],
        text: [51, 65, 85],
        light: [241, 245, 249]
    };

    const drawHeader = () => {
        doc.setFillColor(...colors.dark);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("DARTVOICE ANALYTICS v8.3", margin, 20);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const dateStr = new Date().toLocaleDateString('fr-FR', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
        doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), margin, 30);
        
        doc.setFontSize(12);
        doc.text(`Mode: ${gameState.gameMode.toUpperCase()}`, pageWidth - margin, 20, { align: 'right' });
        doc.setFontSize(10);
        doc.text("Heatmap Amélioré v2.0", pageWidth - margin, 30, { align: 'right' });
        
        y = 55;
    };

    const checkPageBreak = (spaceNeeded) => {
        if (y + spaceNeeded > pageHeight - margin) {
            doc.addPage();
            y = 20;
            return true;
        }
        return false;
    };

    const drawSectionTitle = (title) => {
        checkPageBreak(20);
        doc.setFillColor(...colors.light);
        doc.rect(margin, y, pageWidth - (margin*2), 10, 'F');
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title.toUpperCase(), margin + 5, y + 7);
        y += 20;
    };

    drawHeader();

    if (!gameState.isRunning) {
        let winner = gameState.players.reduce((prev, current) => (prev.setsWon > current.setsWon) ? prev : current);
        if (gameState.gameMode === 'cricket') {
            winner = gameState.players.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        }
        
        doc.setTextColor(...colors.accent);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`🏆 VAINQUEUR : ${winner.name.toUpperCase()}`, pageWidth / 2, y, { align: 'center' });
        y += 15;
    }

    drawSectionTitle("Statistiques des Joueurs");

    gameState.players.forEach((player, idx) => {
        checkPageBreak(50);
        
        doc.setFontSize(11);
        doc.setTextColor(...colors.dark);
        doc.setFont("helvetica", "bold");
        doc.text(`${player.name}`, margin, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.text);
        
        doc.text(`Moyenne: ${player.avg} | Meilleur tour: ${player.bestTurn}`, margin + 5, y);
        y += 6;
        doc.text(`180s: ${player.count180} | 140+: ${player.count140} | 100+: ${player.count100}`, margin + 5, y);
        y += 6;
        
        const doublesPercent = player.doublesAttempted > 0 ? Math.round((player.doublesHit / player.doublesAttempted)*100) : 0;
        doc.text(`Précision doubles: ${doublesPercent}% | Fléchettes lancées: ${player.dartsThrown}`, margin + 5, y);
        y += 6;
        doc.text(`Positions heatmap enregistrées: ${player.dartPositions.length}`, margin + 5, y);
        y += 10;
    });

    for (const player of gameState.players) {
        doc.addPage();
        y = 20;
        drawHeader();
        drawSectionTitle(`Heatmap : ${player.name}`);

        drawHeatmap(player.dartPositions);
        const heatmapImg = heatmapCanvas.toDataURL("image/png");

        doc.addImage(heatmapImg, 'PNG', margin, y, 80, 80);
        y += 90;
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.text(`DartVoice Ultimate Pro v8.3 - Heatmap Amélioré - Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    const filename = `DartVoice_Match_${new Date().getTime()}.pdf`;
    doc.save(filename);
    
    parler("Le rapport PDF avec heatmap a été généré.");
    addLog("Système", "PDF", "Export complet avec heatmap");
}

function getFavoriteZone(player) {
    if (!player.dartPositions || player.dartPositions.length === 0) return "-";
    
    const counts = {};
    let maxCount = 0;
    let fav = "-";
    
    player.dartPositions.forEach(zone => {
        counts[zone] = (counts[zone] || 0) + 1;
        if (counts[zone] > maxCount) {
            maxCount = counts[zone];
            fav = zone;
        }
    });
    
    return `${fav} (${maxCount} fois)`;
}

// ============================================================
// 19. CLAVIER VIRTUEL
// ============================================================

btnKeypadToggle.addEventListener('click', () => {
    currentInput = ""; 
    displayKeypad.textContent = "0";
    modalKeypad.classList.remove('hidden');
});

btnCloseKeypad.addEventListener('click', () => {
    modalKeypad.classList.add('hidden');
});

document.querySelector('.keypad-grid').addEventListener('click', (e) => {
    if (e.target.classList.contains('key-btn')) {
        const val = e.target.dataset.val;
        if (val !== undefined && currentInput.length < 3) {
            currentInput += val;
            displayKeypad.textContent = parseInt(currentInput);
        }
    }
});

document.getElementById('btn-key-del').addEventListener('click', () => {
    currentInput = currentInput.slice(0, -1);
    displayKeypad.textContent = currentInput.length > 0 ? parseInt(currentInput) : "0";
});

document.getElementById('btn-key-ok').addEventListener('click', () => {
    if (currentInput.length > 0) {
        registerScore(parseInt(currentInput));
        currentInput = ""; 
        displayKeypad.textContent = "0";
    }
});

document.querySelectorAll('.key-short').forEach(btn => {
    btn.addEventListener('click', () => {
        registerScore(parseInt(btn.dataset.val));
    });
});

// ============================================================
// 20. PARAMÈTRES
// ============================================================

btnSettings.addEventListener('click', () => {
    modalSettings.classList.remove('hidden');
});

btnCloseSettings.addEventListener('click', () => {
    modalSettings.classList.add('hidden');
});

document.getElementById('btn-test-voice').addEventListener('click', () => {
    window.speechSynthesis.cancel();
    setTimeout(() => {
        parler("Test de la synthèse vocale. Si vous entendez ce message, le système fonctionne correctement.", true);
    }, 100);
});

document.getElementById('setting-voice-enabled').addEventListener('change', (e) => {
    voiceSettings.enabled = e.target.checked;
});

document.getElementById('setting-announce-player').addEventListener('change', (e) => {
    voiceSettings.announcePlayer = e.target.checked;
});

document.getElementById('setting-announce-score').addEventListener('change', (e) => {
    voiceSettings.announceScore = e.target.checked;
});

document.getElementById('setting-announce-each-dart').addEventListener('change', (e) => {
    voiceSettings.announceEachDart = e.target.checked;
});

document.getElementById('setting-announce-total').addEventListener('change', (e) => {
    voiceSettings.announceTotal = e.target.checked;
});

document.getElementById('setting-announce-checkout').addEventListener('change', (e) => {
    voiceSettings.announceCheckout = e.target.checked;
});

document.getElementById('setting-encourage').addEventListener('change', (e) => {
    voiceSettings.encourage = e.target.checked;
});

document.getElementById('setting-voice-speed').addEventListener('input', (e) => {
    voiceSettings.speed = parseFloat(e.target.value);
    document.getElementById('speed-value').textContent = e.target.value + 'x';
});

// ============================================================
// 21. INITIALISATION FINALE
// ============================================================

console.log("🎯 DartVoice Ultimate Pro v8.3 - HEATMAP AMÉLIORÉ");
console.log("✅ Améliorations du heatmap:");
console.log("");
console.log("📍 ENREGISTREMENT DES POSITIONS:");
console.log("  - Détection automatique de toutes les zones");
console.log("  - Support des simples (1-20)");
console.log("  - Support des doubles (D1-D20)");
console.log("  - Support des triples (T1-T20)");
console.log("  - Support des bulls (25, 50)");
console.log("  - Gestion des scores totaux (décomposition)");
console.log("");
console.log("🎨 VISUALISATION:");
console.log("  - Gradient de chaleur amélioré");
console.log("  - Affichage du nombre de hits par zone");
console.log("  - Statistiques détaillées");
console.log("  - Zone favorite calculée");
console.log("  - Précision sur zones de scoring");
console.log("");
console.log("🔍 DEBUG:");
console.log("  - Logs détaillés dans la console");
console.log("  - Vérification de chaque enregistrement");
console.log("  - Tracage des positions exactes");
console.log("");
console.log("🛡️ SÉCURITÉ ANTI-TRICHE MAINTENUE");
console.log("🎤 RECONNAISSANCE VOCALE ULTRA-RAPIDE");
console.log("");
console.log("✨ Tout est prêt ! Lancez une partie et testez le heatmap.");