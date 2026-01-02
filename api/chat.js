const { GoogleGenerativeAI } = require('@google/generative-ai');

// Используем переменную окружения из Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
    // Настройки CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { message, history } = req.body;

        // Явно указываем модель gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const SYSTEM_PROMPT = "Ты — помощник тренера Алексея Климцева. Отвечай кратко и дружелюбно.";

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "Понял, я готов!" }] },
                ...(history || []).map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }))
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });

    } catch (error) {
        console.error('Детальная ошибка:', error);
        res.status(500).json({ 
            reply: "Ошибка нейросети. Попробуйте еще раз позже.",
            details: error.message 
        });
    }
};
