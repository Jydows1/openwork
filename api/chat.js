module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ reply: "Сообщение пустое" });

        // НОВЫЙ СТАНДАРТ URL 2026: router + /models/ + название
        // Используем Llama-3.2-1B-Instruct (она быстрее и доступнее)
        const url = "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-1B-Instruct";

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\nТы помощник тренера Алексея Климцева. Отвечай кратко на русском.<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n${message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n`,
                parameters: {
                    max_new_tokens: 150,
                    return_full_text: false
                }
            }),
        });

        // Если прилетел текст вместо JSON (например, ошибка 404/500)
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textError = await response.text();
            console.error("Non-JSON response:", textError);
            return res.status(200).json({ reply: "🥊 Модель на перезагрузке. Попробуй через 30 секунд!" });
        }

        const data = await response.json();
        console.log("ROUTER RESPONSE:", JSON.stringify(data));

        if (data.error) {
            return res.status(200).json({ reply: "🥊 ИИ разминается: " + (data.error.message || data.error) });
        }

        let output = "";
        if (Array.isArray(data) && data[0]?.generated_text) {
            output = data[0].generated_text;
        } else if (data.generated_text) {
            output = data.generated_text;
        }

        // Если получили пустой ответ от роутера
        if (!output) {
            return res.status(200).json({ reply: "🥊 Привет! Готов ответить на вопросы по боксу." });
        }

        return res.status(200).json({ reply: output.trim() });

    } catch (error) {
        console.error('FINAL ERROR:', error);
        res.status(500).json({ reply: "Ошибка связи. Проверь логи!" });
    }
};
