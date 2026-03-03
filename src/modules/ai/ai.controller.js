const productBuilder = async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI not configured yet.' });
  }
  const { idea } = req.body;
  if (!idea) return res.status(400).json({ error: 'idea is required.' });
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are a digital product strategist. Respond ONLY in valid JSON: {"product_name":"string","format":"string","outline":["string"],"suggested_price":0,"description":"string"}` },
        { role: 'user', content: `My product idea: ${idea}` },
      ],
      max_tokens: 600,
    });
    const raw = completion.choices[0].message.content.trim();
    let result;
    try { result = JSON.parse(raw); } catch { return res.status(500).json({ error: 'AI returned invalid format.' }); }
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'AI service error.' });
  }
};

const automationBuilder = async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI not configured yet.' });
  }
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: 'description is required.' });
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an automation designer. Respond ONLY in valid JSON: {"trigger":"string","trigger_value":"string","message":"string","destination_type":"string","destination_url":"string"}` },
        { role: 'user', content: `Create automation for: ${description}` },
      ],
      max_tokens: 400,
    });
    const raw = completion.choices[0].message.content.trim();
    let result;
    try { result = JSON.parse(raw); } catch { return res.status(500).json({ error: 'AI returned invalid format.' }); }
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'AI service error.' });
  }
};

module.exports = { productBuilder, automationBuilder };
