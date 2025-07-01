import fetch from "node-fetch";

export async function paraphraseText(text) {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
        throw new Error("COHERE_API_KEY environment variable is not set");
    }
    try {
        const response = await fetch("https://api.cohere.ai/v2/chat", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "command-r-plus", // or "command-r" for faster/cheaper
                messages: [
                    {
                        role: "system",
                        content: "You are a paraphrasing assistant. Your task is to rewrite the given text while preserving the original meaning, tone, and key information. Provide only the paraphrased version without any additional comments or explanations."
                    },
                    {
                        role: "user",
                        content: `Please paraphrase the following text:\n\n${text}`
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const responseText = await response.text();
            throw new Error(`Expected JSON response but got ${contentType}: ${responseText}`);
        }

        const data = await response.json();

        if (data.message && data.message.content && data.message.content[0] && data.message.content[0].text) {
            return data.message.content[0].text.trim();
        }

        throw new Error("No paraphrase generated");

    } catch (error) {
        console.error("Paraphrasing error:", error);
        throw new Error(`Paraphrasing failed: ${error.message}`);
    }
}