const { Hercai } = require('hercai');
const herce = new Hercai();

module.exports = async (req, res) => {
    // CORS настройки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ reply: "Сообщение пустое" });

        // Запрос к бесплатному ИИ (модель v3 - стабильная)
        // Нам НЕ нужен API_KEY, библиотека сама всё сделает
        const response = await herce.question({
            model: "v3", 
            content: `Ты — помощник тренера по боксу Алексея Климцева. Отвечай кратко на русском. Вопрос: ${message}`
        });

        if (response && response.reply) {
            return res.status(200).json({ reply: response.reply });
        } else {
            return res.status(200).json({ reply: "🥊 Тренер занят на ринге, спроси чуть позже!" });
        }

    } catch (error) {
        console.error('Hercai Error:', error);
        res.status(500).json({ reply: "Ошибка связи с залом. Попробуй еще раз!" });
    }
};
