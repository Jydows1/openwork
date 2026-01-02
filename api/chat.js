const { GoogleGenerativeAI } = require('@google/generative-ai');

// Инициализируем AI вне основной функции для скорости
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_PROMPT = `Ты — вежливый помощник тренера по боксу Алексея Климцева. 
Отвечай кратко, используй эмодзи. 
Если человек хочет записаться, в конце сообщения добавь тег [LEAD_GEN_TRIGGER]`;

module.exports = async (req, res) => {
    // 1. Настройка заголовков (CORS), чтобы сайт мог достучаться до API
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // 2. Обработка предварительного запроса браузера
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 3. Проверка, что это POST запрос
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Нужен POST запрос' });
    }

    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Сообщение пустое' });
        }

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
                { role: "model", parts: [{ text: "Принято. Я готов отвечать!" }] },
                ...(history || []).map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }))
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // 4. Отправляем ответ
        res.status(200).json({ reply: text });

    } catch (error) {
        console.error('Ошибка Gemini:', error);
        res.status(500).json({ reply: "Ошибка нейросети. Проверьте API ключ в настройках Vercel." });
    }
};
