module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        // Замени блок обработки ответа (внутри try) на этот:
const data = await response.json();

// Посмотрим в логи, что именно прислал HF (поможет нам, если что)
console.log('Ответ от HF:', JSON.stringify(data));

if (data.error && data.error.includes("loading")) {
    return res.status(503).json({ reply: "🥊 ИИ на разминке. Повторите через 15 секунд!" });
}

// Улучшенная логика извлечения текста
let botReply = "";
if (Array.isArray(data) && data[0]?.generated_text) {
    botReply = data[0].generated_text;
} else if (data.generated_text) {
    botReply = data.generated_text;
}

if (botReply) {
    botReply = botReply.replace(/<\|im_end\|>/g, '').trim();
    return res.status(200).json({ reply: botReply });
} else {
    // Если всё еще пусто, выведем ошибку в логи, чтобы понять почему
    console.error('Не удалось извлечь текст из:', data);
    return res.status(200).json({ reply: "🥊 Я готов! Спрашивай что угодно про бокс." });
}

