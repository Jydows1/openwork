module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ reply: "Сообщение пустое" });

        // ИСПОЛЬЗУЕМ НОВЫЙ АДРЕС ROUTER
        const url = "https://router.huggingface.co/hf-inference/models/Qwen/Qwen2.5-7B-Instruct";

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `<|im_start|>system\nТы помощник тренера Алексея Климцева. Отвечай кратко на русском языке. Используй эмодзи. <|im_end|>\n<|im_start|>user\n${message}<|im_end|>\n<|im_start|>assistant\n`,
                parameters: {
                    max_new_tokens: 200,
                    return_full_text: false,
                    temperature: 0.7
                }
            }),
        });

        const data = await response.json();
        console.log("DATA FROM NEW ROUTER:", JSON.stringify(data));

        if (data.error) {
            if (data.error.includes("loading")) {
                return res.status(200).json({ reply: "🥊 ИИ на разминке (загружается). Попробуйте еще раз через 10 секунд!" });
            }
            return res.status(200).json({ reply: "🥊 Проблема с доступом к ИИ: " + (data.error.message || data.error) });
        }

        let output = "";
        if (Array.isArray(data) && data[0]?.generated_text) {
            output = data[0].generated_text;
        } else if (data.generated_text) {
            output = data.generated_text;
        } else if (data.choices && data.choices[0]?.message?.content) {
            // Новый роутер иногда возвращает формат как у OpenAI
            output = data.choices[0].message.content;
        }

        if (!output) {
            return res.status(200).json({ reply: "🥊 Я готов к тренировке! Какой у тебя вопрос?" });
        }

        const cleanReply = output.replace(/<\|im_end\|>/g, '').replace(/<\|im_start\|>/g, '').trim();
        return res.status(200).json({ reply: cleanReply });

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        res.status(500).json({ reply: "Ошибка связи. Проверьте интернет!" });
    }
};
