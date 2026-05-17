const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawMessages = Array.isArray(req.body.messages) ? req.body.messages : [];
    
    const safeUserMessages = rawMessages.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

    const systemPrompt = {
      role: 'system',
      content: `You are Swiftly AI, an elite, professional, and friendly sales assistant. You represent the client's business. 
      Keep your responses very short and conversational, suitable for phone calls.`
    };

    const messages = [systemPrompt, ...safeUserMessages];

    // 1. Minta OpenAI memecah jawaban kata per kata (Mode Stream: true)
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: messages,
      temperature: 0.7,
      stream: true, // <-- INI KUNCI SAKTINYA
    });

    // 2. Buka "Pipa Paralon" khusus ke Vapi
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 3. Alirkan jawaban kata per kata langsung ke speaker Vapi
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    // 4. Tutup telepon jika AI sudah selesai bicara
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan', details: error.message });
  }
};