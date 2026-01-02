module.exports = async (req, res) => {
    // Настройки CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        // Прямой запрос к Google API без посредников
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Ты — помощник тренера по боксу Алексея Климцева. Отвечай кратко. Вопрос пользователя: ${message}` }]
                }]
            })
        });

        const data = await response.json();

        // Проверка на ошибки от самого Google
        if (data.error) {
            console.error('Google API Error:', data.error);
            return res.status(500).json({ reply: "Ошибка API: " + data.error.message });
        }

        const botReply = data.candidates[0].content.parts[0].text;
        res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ reply: "Не удалось связаться с ИИ." });
    }
};

