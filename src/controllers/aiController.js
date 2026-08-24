import asyncHandler from "express-async-handler";
import { getOpenAIClient, OPENAI_MODEL } from "../config/openai.js";

const MAX_INPUT_LENGTH = 6000;

const ACTION_INSTRUCTIONS = {
  complete:
    "Continue writing from exactly where the draft leaves off. Match the existing voice and tense, and return only the continuation — do not repeat the text already written.",
  rephrase:
    "Rewrite the text with different wording and sentence structure while keeping the same meaning, facts, and roughly the same length.",
  shorten:
    "Rewrite the text to be noticeably more concise, keeping the key facts and the original meaning. Cut filler, not substance.",
  lengthen:
    "Expand the text with more relevant detail, examples, or context while staying true to the original meaning and voice. Do not pad it with empty fluff.",
  humanize:
    "Rewrite the text so it reads naturally and conversationally, like it was written by a person. Vary sentence length, remove stiff or robotic phrasing and AI-sounding clichés, and keep it warm but professional.",
  custom: "Follow the user's instruction below to edit the text.",
};

// @route POST /api/ai/writing (admin only)
// body: { action: "complete"|"rephrase"|"shorten"|"lengthen"|"humanize"|"custom", text, instruction?, context? }
export const assistWriting = asyncHandler(async (req, res) => {
  const { action, text = "", instruction = "", context = "" } = req.body;

  if (!ACTION_INSTRUCTIONS[action]) {
    res.status(400);
    throw new Error("Unknown AI action.");
  }
  if (action !== "complete" && !text.trim()) {
    res.status(400);
    throw new Error("There's no text to work with yet.");
  }
  if (action === "custom" && !instruction.trim()) {
    res.status(400);
    throw new Error("Add an instruction for the AI to follow.");
  }
  if (text.length > MAX_INPUT_LENGTH) {
    res.status(400);
    throw new Error(`Text is too long for the AI assistant (max ${MAX_INPUT_LENGTH} characters).`);
  }
  if (!process.env.OPENAI_API_KEY) {
    res.status(503);
    throw new Error("The AI writing assistant isn't configured on the server yet.");
  }

  const systemPrompt = [
    "You are a writing assistant embedded in the admin panel of a personal portfolio website.",
    "You edit or generate short copy for fields such as bios, project descriptions, and service blurbs.",
    context && `Field context: ${context}`,
    `Task: ${ACTION_INSTRUCTIONS[action]}`,
    action === "custom" && instruction && `Instruction: ${instruction}`,
    "Respond with ONLY the resulting text — no preamble, no surrounding quotation marks, no markdown formatting, no explanations.",
  ]
    .filter(Boolean)
    .join("\n");

  const userContent =
    action === "complete" && !text.trim() ? "(there's no draft yet — write an opening for this field)" : text;

  let completion;
  try {
    completion = await getOpenAIClient().chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: action === "humanize" ? 0.85 : 0.7,
      max_tokens: 1024,
    });
  } catch (err) {
    console.error("OpenAI request failed:", err.message);
    res.status(502);
    throw new Error("The AI assistant is temporarily unavailable. Please try again.");
  }

  const result = completion.choices?.[0]?.message?.content?.trim();
  if (!result) {
    res.status(502);
    throw new Error("The AI assistant returned an empty response. Try again.");
  }

  res.json({ success: true, result });
});
