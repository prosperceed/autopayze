export const groqClient = {
  apiKey: process.env.GROQ_API_KEY ?? '',
  enabled: Boolean(process.env.GROQ_API_KEY),
};
