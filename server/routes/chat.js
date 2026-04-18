const express = require('express');
const router = express.Router();
const { handleChat } = require('../chatbot/engine');

// POST /api/chat
router.post('/', async (req, res) => {
  const { message, userId } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'الرسالة لا يمكن أن تكون فارغة' });
  }

  try {
    const reply = await handleChat(message, userId);
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'خطأ في معالجة رسالتك', reply: 'عذراً، حدث خطأ. حاول مرة أخرى.' });
  }
});

module.exports = router;
