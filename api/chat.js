module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;

        // Обращаемся к модели Qwen через API Hugging Face
        const response = await fetch(
            "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
            {
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: `<|im_start|>system
Ты помощник тренера по боксу Алексея Климцева. Отвечай кратко на русском языке. Используй эмодзи 🥊.<|im_end|>
<|im_start|>user
${message}<|im_end|>
<|im_start|>assistant`,
                    parameters: {
                        max_new_tokens: 300,
                        return_full_text: false,
                        temperature: 0.7
                    }
                }),
            }
        );

        const data = await response.json();

        // Если модель только проснулась (cold start)
        if (data.error && data.error.includes("loading")) {
            return res.status(503).json({ 
                reply: "🥊 ИИ на разминке (модель загружается). Повторите вопрос через 15 секунд!" 
            });
        }

        // Вытаскиваем текст ответа
        let botReply = data[0]?.generated_text || "Тренер сейчас на спарринге, попробуйте позже.";
        
        // Убираем технические хвосты, если они есть
        botReply = botReply.replace(/<\|im_end\|>/g, '').trim();

        res.status(200).json({ reply: botReply });

    } catch (error) {
        console.error('Ошибка Qwen:', error);
        res.status(500).json({ reply: "Произошла ошибка связи с залом." });
    }
};
