module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ reply: "Сообщение пустое" });

        // ИСПРАВЛЕННЫЙ АДРЕС (БЕЗ hf-inference)
        const url = "https://router.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct";

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `<|im_start|>system\nТы помощник тренера Алексея Климцева. Отвечай кратко на русском языке. <|im_end|>\n<|im_start|>user\n${message}<|im_end|>\n<|im_start|>assistant\n`,
                parameters: {
                    max_new_tokens: 200,
                    return_full_text: false,
                    temperature: 0.7
                }
            }),
        });

        // ПРОВЕРКА: Если ответ не OK (например, 404), не пытаемся парсить JSON
        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF Error Text:", errorText);
            return res.status(200).json({ reply: "🥊 Упс! Сервер модели временно не отвечает. Попробуйте через минуту." });
        }

        const data = await response.json();
        console.log("SUCCESS DATA:", JSON.stringify(data));

        let output = "";
        if (Array.isArray(data) && data[0]?.generated_text) {
            output = data[0].generated_text;
        } else if (data.generated_text) {
            output = data.generated_text;
        }

        if (!output) {
            return res.status(200).json({ reply: "🥊 Привет! Готов к тренировке. Какой у тебя вопрос?" });
        }

        const cleanReply = output.replace(/<\|im_end\|>/g, '').trim();
        return res.status(200).json({ reply: cleanReply });

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        res.status(500).json({ reply: "Ошибка связи. Проверьте соединение!" });
    }
};
