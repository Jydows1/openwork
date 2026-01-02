module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ reply: "Сообщение пустое" });

        // МЕНЯЕМ МОДЕЛЬ НА MISTRAL (самая стабильная на HF)
        const url = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                // Формат промпта для Mistral
                inputs: `[INST] Ты вежливый помощник тренера по боксу Алексея Климцева. Отвечай кратко на русском языке. Вопрос: ${message} [/INST]`,
                parameters: {
                    max_new_tokens: 200,
                    return_full_text: false,
                    temperature: 0.7
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF Error:", errorText);
            // Если и Mistral выдает 404, попробуем вернуть управление пользователю
            return res.status(200).json({ reply: "🥊 Тренер на тренировке. Попробуйте спросить чуть позже!" });
        }

        const data = await response.json();
        
        let output = "";
        if (Array.isArray(data) && data[0]?.generated_text) {
            output = data[0].generated_text;
        } else if (data.generated_text) {
            output = data.generated_text;
        }

        if (!output) {
            return res.status(200).json({ reply: "🥊 Привет! Я на связи. Какой вопрос по боксу?" });
        }

        return res.status(200).json({ reply: output.trim() });

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        res.status(500).json({ reply: "Ошибка связи. Проверьте интернет!" });
    }
};
