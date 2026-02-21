const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { toFile } = require('groq-sdk');
const authMiddleware = require('../middleware/auth');
const Petition = require('../models/Petition');

// Lazy-initialize Groq client (reads env var at request time, after dotenv loads)
let groqClient = null;
const getGroq = () => {
    if (!groqClient) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
};

// Language configs for petition generation
const PETITION_LANG_CONFIG = {
    ta: {
        name: 'Tamil',
        systemExtra: `CRITICAL INSTRUCTION: You MUST write the ENTIRE petition ONLY in Tamil language (தமிழ்). 
DO NOT write a single word in English. DO NOT include English translations.
If you write anything in English, you have FAILED the task.

Use these exact Tamil section headings in order:
1. மாண்புமிகு [நீதிமன்றம்] முன்பு
2. மனு எண். _____ / ${new Date().getFullYear()}
3. இடையே:
4. மனுதாரர்: [பெயர்], பதிலிடப்பட்டவர்: [பெயர்]
5. மிகவும் மரியாதையுடன் சமர்ப்பிக்கப்படுகிறது:
6. வழக்கின் உண்மைகள்: (குறைந்தது 5 புள்ளிகள்)
7. காரணங்கள்: (குறைந்தது 3 காரணங்கள்)
8. வேண்டுகோள்:
9. இந்த கருணையான செயலுக்கு மனுதாரர் என்றும் கடமைப்பட்டிருப்பார்.
10. இடம்: ___, தேதி: ___, மனுதாரர் வழக்குரைஞர்

Write ALL content — facts, grounds, prayer — in Tamil only. No English at all.`,
        userPrompt: (desc) =>
            `கீழே கொடுக்கப்பட்டுள்ள சட்ட நிலைமையை ஒரு முறையான இந்திய சட்ட மனுவாக தமிழில் மாற்றுங்கள்.\n\nவிவரம்: "${desc}"\n\nமுழு மனுவையும் தமிழ் மட்டுமே பயன்படுத்தி எழுதவும். ஒரு வார்த்தை கூட ஆங்கிலத்தில் எழுதக்கூடாது.`,
    },
    hi: {
        name: 'Hindi',
        systemExtra: `CRITICAL INSTRUCTION: You MUST write the ENTIRE petition ONLY in Hindi language (हिंदी). DO NOT write anything in English.`,
        userPrompt: (desc) =>
            `इस कानूनी स्थिति को हिंदी में एक औपचारिक भारतीय कानूनी याचिका में परिवर्तित करें:\n\n"${desc}"\n\nपूरी याचिका केवल हिंदी में लिखें। एक भी शब्द अंग्रेजी में न लिखें।`,
    },
};

// Detect Tamil from description text (server-side fallback)
const detectTamilFromText = (text) => {
    if (!text) return false;
    // Tamil Unicode block U+0B80–U+0BFF
    if (/[\u0B80-\u0BFF]/.test(text)) return true;
    // English keywords requesting Tamil output
    return /\btamil\b/i.test(text);
};

// Resolve language: prefer explicit langCode, fallback to text detection
const getLangConfig = (langCode, description) => {
    // Check explicit language code first
    if (langCode) {
        const base = langCode.split('-')[0].toLowerCase();
        if (PETITION_LANG_CONFIG[base]) return PETITION_LANG_CONFIG[base];
    }
    // Server-side Tamil detection from description
    if (detectTamilFromText(description)) return PETITION_LANG_CONFIG.ta;
    return null;
};

// POST /api/petition/generate — Generate AI petition and save to DB
router.post('/generate', authMiddleware, async (req, res) => {
    try {
        const { description, language } = req.body;
        if (!description || !description.trim()) {
            return res.status(400).json({ message: 'Description is required.' });
        }

        const langConfig = getLangConfig(language, description.trim());
        const year = new Date().getFullYear();

        let systemPrompt = `You are a senior Indian legal advocate with 20+ years of experience drafting formal legal petitions.
Your task is to convert a user's description of their legal situation into a professionally formatted legal petition document.`;

        if (langConfig) {
            systemPrompt += `\n\n${langConfig.systemExtra}`;
        } else {
            systemPrompt += `

Follow this exact structure:
1. Header: "IN THE HON'BLE [COURT NAME]"
2. Petition number: "Petition No. _____ of ${year}"
3. "BETWEEN:" section with Petitioner and Respondent
4. "MOST RESPECTFULLY SHOWETH:" section
5. Numbered facts (at least 5 points)
6. "GROUNDS:" section (at least 3 grounds)
7. "PRAYER:" section
8. "AND FOR THIS ACT OF KINDNESS, THE PETITIONER AS IN DUTY BOUND SHALL EVER PRAY."
9. Signature block: Place, Date, Advocate for Petitioner

Use formal Indian legal language. Do NOT add commentary outside the petition.`;
        }

        const userPrompt = langConfig
            ? langConfig.userPrompt(description.trim())
            : `Convert this legal situation into a formal Indian legal petition:\n\n"${description.trim()}"\n\nGenerate a complete, properly formatted petition document.`;


        const completion = await getGroq().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 2048,
        });

        const petition = completion.choices[0]?.message?.content;
        if (!petition) {
            return res.status(500).json({ message: 'Failed to generate petition. Please try again.' });
        }

        // Save to MongoDB (only for users, not advocates)
        if (req.user.role === 'user') {
            try {
                await Petition.create({
                    user_id: req.user.id,
                    description: description.trim(),
                    petition_text: petition,
                });
            } catch (dbErr) {
                console.warn('Could not save petition to DB:', dbErr.message);
                // Don't fail the request if DB save fails
            }
        }

        res.json({ petition });
    } catch (err) {
        console.error('Groq API error:', err);
        if (err.status === 401) {
            return res.status(500).json({ message: 'AI API authentication failed. Check API key.' });
        }
        if (err.status === 429) {
            return res.status(429).json({ message: 'AI API rate limit reached. Please try again in a moment.' });
        }
        res.status(500).json({ message: 'Failed to generate petition. Please try again.' });
    }
});

// GET /api/petition/history — Get user's petition history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const petitions = await Petition.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .limit(10)
            .select('description created_at');
        res.json({ petitions });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch petition history.' });
    }
});

// POST /api/petition/transcribe — Transcribe audio using Groq Whisper
// Accepts: raw audio bytes (Content-Type: application/octet-stream or audio/*)
// Query param: ?filename=recording.wav (optional, helps Groq pick the decoder)
router.post('/transcribe', authMiddleware,
    express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '25mb' }),
    async (req, res) => {
        try {
            const audioBuffer = req.body;
            if (!audioBuffer || !audioBuffer.length) {
                return res.status(400).json({ message: 'No audio data received.' });
            }

            const filename = req.query.filename || 'recording.wav';

            // Convert Buffer → File object that Groq SDK accepts
            const audioFile = await toFile(audioBuffer, filename, {
                type: req.headers['content-type'] || 'audio/wav',
            });

            const transcription = await getGroq().audio.transcriptions.create({
                file: audioFile,
                model: 'whisper-large-v3-turbo',
                language: req.query.lang ? req.query.lang.split('-')[0] : undefined,
                response_format: 'json',
            });

            res.json({ transcript: transcription.text || '' });
        } catch (err) {
            console.error('Whisper transcription error:', err);
            if (err.status === 400) {
                return res.status(400).json({ message: 'Invalid audio file. Please try WAV or MP3 format.' });
            }
            res.status(500).json({ message: 'Transcription failed. Please try again.' });
        }
    }
);

module.exports = router;

