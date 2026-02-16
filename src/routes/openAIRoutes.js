const express = require('express');

const router = express.Router();

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT || "gpt-4o";
const API_VERSION = process.env.AZURE_API_VERSION || "2024-08-01-preview";

const endpoint = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;


async function callAzureOpenAI(messages) {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": AZURE_OPENAI_KEY,
        },
        body: JSON.stringify({
            messages,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Azure OpenAI Error:", errorData);
        throw new Error(errorData?.error?.message || "Azure OpenAI request failed");
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid response format from Azure OpenAI");
    }

    return data.choices[0].message.content.trim();
}


router.get("/auth-test", async (req, res) => {
    try {
        const result = await callAzureOpenAI([
            { role: "user", content: "Respond with OK only." }
        ]);

        res.json({ success: true, message: result });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});


router.post("/translate", async (req, res) => {
    try {
        const { text, fromLang, toLang } = req.body;

        if (!text || !fromLang || !toLang) {
            return res.status(400).json({
                error: "text, fromLang and toLang are required"
            });
        }

        const prompt = `
Translate the following text from ${fromLang} to ${toLang}.
Only return the translation. No extra text.

"${text}"
`;

        const translation = await callAzureOpenAI([
            { role: "user", content: prompt }
        ]);

        res.json({ translation });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post("/suggestions", async (req, res) => {
    try {

        console.log("Received suggestions request with body:", req.body);
        const { messages, currentLanguage } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid messages array" });
        }

        const lastFewMessages = messages
            .slice(-3)
            .map(msg => `${msg.isUserA ? 'User A' : 'User B'}: ${msg.text}`)
            .join('\n');

        const prompt = `
Based on this conversation:

${lastFewMessages}

Generate 3 short natural responses in ${currentLanguage}.
Rules:
- Under 10 words each
- No numbering
- Separate responses with |
- Only responses, no extra text
`;

        const result = await callAzureOpenAI([
            { role: "user", content: prompt }
        ]);

        const suggestions = result.split("|").map(s => s.trim());

        res.json({ suggestions });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post("/summarize", async (req, res) => {
    try {
        const { messages, targetLanguage } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid messages array" });
        }

        const conversationText = messages
            .map(msg => `${msg.isUserA ? 'User A' : 'User B'}: ${msg.text}`)
            .join('\n');

        const prompt = `
Summarize this bilingual conversation in ${targetLanguage}.
Focus on:
- Main topics
- Key points from both sides
- Any conclusions

Conversation:
${conversationText}
`;

        const summary = await callAzureOpenAI([
            { role: "user", content: prompt }
        ]);

        res.json({ summary });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
