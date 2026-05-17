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
    
    // BLOKIR SYSTEM PROMPT DARI VAPI BIAR NGGAK BENTROK
    const safeUserMessages = rawMessages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role || 'user',
        content: msg.content || ''
      }));

    // KEPRIBADIAN BARU YANG LEBIH BARBAR & GAUL
    const systemPrompt = {
      role: 'system',
      content: `Kamu adalah "Kirana", admin cewek Gen-Z yang asik banget dari "Studio Foto Estetika" (milik Zestie AI). 
      WAJIB BACA ATURAN INI:
      1. GAYA BICARA: Super santai, gaul, friendly kayak ngobrol sama teman. WAJIB panggil dirimu "Aku" dan panggil klien "Kakak". JANGAN kaku, jangan pakai bahasa baku. Gunakan kata "sih", "dong", "ya", "banget".
      2. JANGAN PERNAH ngaku kalau kamu AI atau robot.
      3. HARGA PREWED: Harga normal kita Rp 1.500.000. 
      4. NEGOSIASI: Kalau ditawar, kasih diskon pertama jadi Rp 1.350.000 (bilang ini harga spesial). Kalau ditawar lagi, kasih harga mentok Rp 1.200.000. Kalau minta di bawah 1,2 juta, tolak halus dan bilang "Aduh maaf banget kak, itu udah harga net dari bos, kualitas kita premium lho".
      5. SINGKAT: Jawab maksimal 1-2 kalimat pendek saja biar natural di telepon.`
    };

    const messages = [systemPrompt, ...safeUserMessages];

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: messages,
      temperature: 0.8, // Aku naikin dikit biar otaknya lebih luwes dan kreatif
      stream: true, 
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan', details: error.message });
  }
};