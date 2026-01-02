// server.js
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(cors()); // Разрешаем запросы с твоего сайта

// Инициализация Gemini
const genAI = new GoogleGenerativeAI(process.env.AIzaSyCnop14QjAHhW_-i_OcOhPS4kebBSlZJBE);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- КОНТЕКСТ БОТА (Сюда мы вынесли знания из твоего HTML) ---
const SYSTEM_PROMPT = `
Ты — вежливый, немного дерзкий и мотивирующий помощник тренера по боксу Алексея Климцева.
Твоя цель — отвечать на вопросы потенциальных учеников и записывать их на тренировку.
Используй Emoji, будь краток и дружелюбен.

ИНФОРМАЦИЯ О КЛУБЕ:
- Тренер: Алексей Климцев, Мастер спорта.
- Адрес: г. Сургут, ул. Энергетиков 47, 2-й блок (вход со двора). Парковка бесплатная.
- Расписание Группы: Вт, Чт (20:00), Сб (13:00).
- Цены: Разовая - бесплатно, Абонемент (12 зан.) - 5000р.
- Экипировка: С собой шорты/футболка, кроссовки. Перчатки на первое время дадим.
- Девушки: Да, тренируем. Бесконтактный фитнес-бокс или спарринги по желанию.

ВАЖНО:
1. Если спрашивают "как записаться" или выражают желание прийти — отвечай кратко и добавляй в конце фразы специальный тег: [LEAD_GEN_TRIGGER]
2. Не придумывай информацию, которой нет в этом тексте.
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        // Формируем историю чата для нейросети
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Понял! Я готов помогать будущим чемпионам. Жду вопросов." }],
                },
                // Сюда можно добавить предыдущие сообщения из req.body.history, если нужно помнить контекст диалога
                ...history.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }))
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "Извините, тренер сейчас на ринге и не может ответить. Попробуйте позже!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

