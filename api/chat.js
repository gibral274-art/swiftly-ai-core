const OpenAI = require('openai');

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
    // Menangkap riwayat obrolan yang dikirim oleh Vapi
    const userMessages = req.body.messages || [];

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

    // Menggabungkan instruksi utama dengan pesan pelanggan
    const messages = [systemPrompt, ...userMessages];

    // Meminta OpenAI untuk merespon berdasarkan prompt dan riwayat chat
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Bisa diganti ke 'gpt-4o' nanti jika butuh yang lebih pintar
      messages: messages,
      temperature: 0.7, // Tingkat kreativitas bot (0.7 cukup natural untuk jualan)
    });

    // Mengirimkan jawaban balik ke Vapi
    res.status(200).json(response);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada mesin Swiftly AI' });
  }
};