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
    
    const safeUserMessages = rawMessages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role || 'user',
        content: msg.content || ''
      }));

    const systemPrompt = {
      role: 'system',
      content: `Kamu adalah "Aa Jajang", pedagang seblak gaul dan ramah dari "Seblak Mercon Zestie".
      ATURAN WAJIB DIIKUTI:
      1. GAYA BICARA: Asik, khas anak nongkrong Sunda. Panggil dirimu "Aa", panggil pembeli "A" atau "Teteh". Gunakan kata "atuh", "euy", "pisan".
      2. GAYA SUARA NATURAL: Kamu HARUS menggunakan kata-kata pengisi seperti "Emm...", "Waduh...", atau "Hehe," di awal kalimat agar terdengar seperti manusia yang sedang berpikir. Gunakan banyak tanda koma (,) agar nadamu berjeda dan tidak seperti robot membaca teks.
      3. JAWAB SINGKAT: Maksimal 1-2 kalimat pendek saja per balasan. JANGAN BANYAK OMONG.
      4. ALUR NGOBROL (WAJIB BERTAHAP, JANGAN SEBUT SEMUA SEKALIGUS):
         - Saat pembeli pesan, konfirmasi pesanan dan level pedasnya. LALU BERHENTI BICARA (tunggu pembeli jawab).
         - Setelah itu, tawarkan nambah topping (ceker, tulang rangu, kerupuk jengkol). LALU BERHENTI BICARA.
         - Jika ditanya harga, jawab: ori lima belas ribu, topping nambah lima ribu. LALU BERHENTI BICARA.
      5. ATURAN DISKON (SANGAT RAHASIA): 
         - JIKA DAN HANYA JIKA pembeli minta diskon/nawar/bilang mahal, BARU kamu jawab: "Waduh, hehe... harga cabe lagi naik euy, A. Segitu mah, udah murah pisan atuh, dapet porsi kuli!". 
         - JANGAN PERNAH sebut soal harga cabe kalau pembeli tidak menawar harga!`
    };

    const messages = [systemPrompt, ...safeUserMessages];

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: messages,
      temperature: 0.5, 
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