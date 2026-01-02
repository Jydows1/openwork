module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ reply: "Сообщение пустое" });

        const response = await fetch(
            "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
            {
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: `<|im_start|>system\nТы помощник тренера Алексея Климцева. Отвечай кратко на русском языке. Используй эмодзи. <|im_end|>\n<|im_start|>user\n${message}<|im_end|>\n<|im_start|>assistant\n`,
                    parameters: {
                        max_new_tokens: 200,
                        return_full_text: false, // Это важно, чтобы не дублировать вопрос в ответе
                        temperature: 0.7
                    }
                }),
            }
        );

        const data = await response.json();
        
        // ЛОГ ДЛЯ ТЕБЯ: Посмотришь в Vercel Logs, что пришло на самом деле
        console.log("RAW DATA FROM HF:", JSON.stringify(data));

        if (data.error) {
            if (data.error.includes("loading")) {
                return res.status(200).json({ reply: "🥊 ИИ на разминке, подождите 10 секунд и спросите еще раз!" });
            }
            return res.status(200).json({ reply: "🥊 Тренер немного занят, попробуйте через минуту." });
        }

        // Вытаскиваем текст максимально надежно
        let output = "";
        if (Array.isArray(data) && data[0]?.generated_text) {
            output = data[0].generated_text;
        } else if (data.generated_text) {
            output = data.generated_text;
        }

        if (!output || output.trim().length === 0) {
            return res.status(200).json({ reply: "🥊 Я готов! Какой вопрос по тренировкам?" });
        }

        // Финальная чистка от остатков тегов
        const cleanReply = output.replace(/<\|im_end\|>/g, '').replace(/<\|im_start\|>/g, '').trim();

        return res.status(200).json({ reply: cleanReply });

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        res.status(500).json({ reply: "Ошибка связи с залом. Проверьте интернет!" });
    }
};
