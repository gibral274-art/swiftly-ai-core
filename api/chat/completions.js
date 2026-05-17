const OpenAI = require('openai'); // Pastikan huruf 'c' kecil!

// Mengambil API Key dari Environment Variable Vercel
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

module.exports = async function (req, res) {
  // Hanya menerima request bertipe POST dari Vapi
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Menangkap riwayat obrolan yang dikirim oleh Vapi. 
    // Kita pastikan formatnya benar-benar sebuah Array.
    const rawMessages = Array.isArray(req.body.messages) ? req.body.messages : [];

    // --- INI PENYARINGNYA (Mencegah Error OpenAI) ---
    // Kita bersihkan data dari Vapi supaya OpenAI tidak marah.
    const safeUserMessages = rawMessages.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

    // INI ADALAH OTAK SWIFTLY AI (System Prompt)
    const systemPrompt = {
      role: 'system',
      content: `You are Swiftly AI, an elite, professional, and friendly sales assistant. You represent the client's business. 
      
      Core Directives:
      1. Language Adaptation: Always respond in the language the user speaks to you. If they speak Indonesian or local slang, reply in natural, polite Indonesian. If they speak English, use professional business English.
      2. Tone: Warm, confident, concise, and highly persuasive. Do not sound like a robot. Keep your responses short and conversational, suitable for phone calls.
      3. Negotiation Protocol: If the user asks for a discount or negotiates a price, do not immediately give the lowest price. First, highlight the value of the product. If they insist, offer a small discount (maximum 10%) or a bundle deal to secure the sale immediately.
      4. Goal: Your primary goal is to close the sale or set up a concrete appointment. Always guide the conversation towards an agreement.
      5. Handling the Unknown: If asked something completely unrelated to sales or scheduling, politely steer the conversation back to the business offerings.`
    };

    // Menggabungkan instruksi utama dengan pesan yang sudah bersih
    const messages = [systemPrompt, ...safeUserMessages];

    // Meminta OpenAI untuk merespon
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: messages,
      temperature: 0.7, 
    });
// Menangkap teks jawaban dari OpenAI
const aiMessageContent = response.choices[0].message.content || "Maaf, saya tidak bisa merespons saat ini.";

// --- ALAT SADAP ---
console.log("Jawaban Swiftly AI:", aiMessageContent);

// Mengirimkan jawaban balik ke Vapi DENGAN FORMAT YANG BENAR
res.status(200).json({
  choices: [
    {
      message: {
        role: "assistant",
        content: aiMessageContent
      }
    }
  ]
});

  } catch (error) {
    console.error('Error:', error);
    // Kita tambahkan error.message agar kalau gagal lagi, penyebabnya lebih jelas
    res.status(500).json({ error: 'Terjadi kesalahan pada mesin Swiftly AI', details: error.message });
  }
};