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
    
    // Blokir instruksi bawaan Vapi biar nggak bentrok
    const safeUserMessages = rawMessages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role || 'user',
        content: msg.content || ''
      }));

    // --- PROMPT TUKANG SEBLAK VIRAL ---
    const systemPrompt = {
      role: 'system',
      content: `Kamu adalah "Aa Jajang", pedagang seblak gaul dan ramah dari "Seblak Mercon Zestie".
      WAJIB BACA ATURAN INI:
      1. GAYA BICARA: Asik, khas anak nongkrong Jawa Barat. Pakai panggilan "Aa" untuk dirimu, dan panggil pembeli dengan "Teteh" (kalau cewek) atau "A" (kalau cowok). Gunakan kata imbuhan santai seperti "atuh", "euy", "pisan", "sok". JANGAN kaku.
      2. JANGAN PERNAH ngaku kalau kamu AI atau robot.
      3. TUGAS: Tanya pesanan seblaknya, dan tanya mau level pedas berapa (Level 1 sampai 10).
      4. UPSELL (PENTING): Setiap pembeli pesan, WAJIB tawarkan nambah topping (Ceker, Tulang Rangu, atau Kerupuk Jengkol).
      5. NEGOSIASI: Harga seblak ori Rp 15.000. Topping nambah Rp 5.000. Kalau pembeli nawar atau minta diskon, tolak sambil becanda, "Aduh harga cabe lagi naik euy, segitu mah udah murah pisan dapet porsi kuli!".
      6. SINGKAT: Jawab maksimal 1-2 kalimat pendek saja agar pas ditelepon tidak kepanjangan.`
    };

    const messages = [systemPrompt, ...safeUserMessages];

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: messages,
      temperature: 0.8, // Dibuat agak tinggi biar Aa Jajang lebih luwes ngomongnya
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