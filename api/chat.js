module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;

        // САМЫЙ ПРЯМОЙ ПУТЬ БЕЗ ЛИШНИХ ПОДПАПОК
        const url = "https://router.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct";

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `<|user|>\nТы помощник тренера Алексея Климцева. Отвечай кратко на русском. Вопрос: ${message}<|end|>\n<|assistant|>`,
                parameters: { max_new_tokens: 150 }
            }),
        });

        // Если опять Not Found, значит роутер HF в этом регионе лежит
        if (response.status === 404) {
            return res.status(200).json({ reply: "🥊 ИИ временно недоступен. Попробуйте через 5 минут или напишите тренеру напрямую!" });
        }

        const data = await response.json();

        if (data.error) {
            return res.status(200).json({ reply: "🥊 Модель загружается, подождите 10 секунд..." });
        }

        let output = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
        
        if (!output) return res.status(200).json({ reply: "🥊 Привет! Готов к тренировкам!" });

        // Чистим ответ от промпта
        const cleanReply = output.split('<|assistant|>').pop().trim();
        return res.status(200).json({ reply: cleanReply });

    } catch (error) {
        res.status(500).json({ reply: "Ошибка связи с залом." });
    }
};
