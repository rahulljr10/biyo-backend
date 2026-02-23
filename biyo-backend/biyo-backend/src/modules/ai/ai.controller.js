const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /ai/product-builder
const productBuilder = async (req, res) => {
  const { idea } = req.body;

  if (!idea) {
    return res.status(400).json({ error: 'idea is required.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a digital product strategist for creators. 
          Given a creator's idea, respond with ONLY valid JSON (no markdown, no explanation).
          JSON format:
          {
            "product_name": "string",
            "format": "string (e.g. PDF Guide, Video Course, Template, Ebook, Checklist)",
            "outline": ["string", "string", "string"],
            "suggested_price": number,
            "description": "string (2-3 sentences, compelling sales copy)"
          }`,
        },
        {
          role: 'user',
          content: `My product idea: ${idea}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const raw = completion.choices[0].message.content.trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
    }

    res.json({ result });
  } catch (err) {
    console.error('ProductBuilder error:', err.message);
    res.status(500).json({ error: 'AI service error.' });
  }
};

// POST /ai/automation-builder
const automationBuilder = async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'description is required.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an automation flow designer for a creator platform.
          Given a description, respond with ONLY valid JSON.
          JSON format:
          {
            "trigger": "string (one of: comment, dm, free_download, purchase)",
            "trigger_value": "string (optional keyword or condition)",
            "message": "string (the message to send to the customer)",
            "destination_type": "string (one of: store, product, custom)",
            "destination_url": "string (optional URL)"
          }`,
        },
        {
          role: 'user',
          content: `Create an automation for: ${description}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 400,
    });

    const raw = completion.choices[0].message.content.trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
    }

    res.json({ result });
  } catch (err) {
    console.error('AutomationBuilder error:', err.message);
    res.status(500).json({ error: 'AI service error.' });
  }
};

module.exports = { productBuilder, automationBuilder };
