module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        // ИСПОЛЬЗУЕМ v1 (Стабильную) вместо v1beta
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Ты помощник тренера по боксу. Ответь кратко: ${message}` }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            // Если v1 не сработала, пробуем вывести почему
            console.error('Google API Error:', data.error);
            return res.status(data.error.code || 500).json({ 
                reply: "Извините, сервис временно недоступен.",
                debug: data.error.message 
            });
        }

        const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Я не знаю, что ответить.";
        res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ reply: "Произошла ошибка при связи с ИИ." });
    }
};

