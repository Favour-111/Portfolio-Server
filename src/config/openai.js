import OpenAI from "openai";

// Lazily created so a missing/blank key doesn't crash server startup — it
// only matters once someone actually opens the AI writing assistant.
let client = null;

export const getOpenAIClient = () => {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return client;
};

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
