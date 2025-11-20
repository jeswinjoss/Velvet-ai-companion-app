
import { GoogleGenAI, Chat, Modality, Content, Part } from "@google/genai";
import { CharacterProfile, Message } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing in process.env. Ensure it is set in your environment configuration.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
];

export const generatePersonaImage = async (
  name: string, 
  relationship: string, 
  traits: string
): Promise<string> => {
  const ai = getClient();
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=512`;

  // Prompt Refinement for Photorealism
  // We explicitly ask for photography terms to avoid cartoon/3D render styles
  const refineReq = `
    Create a raw, photorealistic image prompt for: ${name}, a ${relationship}. 
    Visual traits: ${traits}. 
    Style: Real life photography, 8k, detailed skin texture, cinematic lighting, alluring, shot on 35mm lens.
    Output ONLY the prompt string.
  `;

  let refinedPrompt = `Raw candid photo of ${name}, ${relationship}, ${traits}, highly detailed skin, 8k, f/1.8, photorealistic, cinematic lighting, alluring`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: refineReq,
      config: { safetySettings: SAFETY_SETTINGS }
    });
    if (res.text) refinedPrompt = res.text.trim();
  } catch (e) {}

  // Try Imagen
  try {
    const imgRes = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: refinedPrompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1', safetySettings: SAFETY_SETTINGS },
    });
    const b64 = imgRes.generatedImages?.[0]?.image?.imageBytes;
    if (b64) return `data:image/jpeg;base64,${b64}`;
  } catch (e) {}

  // Fallback Flash Image
  try {
    const flashRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: refinedPrompt }] },
      config: { responseModalities: [Modality.IMAGE], safetySettings: SAFETY_SETTINGS },
    });
    const d = flashRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (d) return `data:image/png;base64,${d}`;
  } catch (e) {}

  return defaultAvatar;
};

export const generateRandomProfileData = async (genderPreference: 'male' | 'female' | 'any'): Promise<Partial<CharacterProfile>> => {
    const ai = getClient();
    const genderPrompt = genderPreference === 'any' ? '' : `The character MUST be ${genderPreference}.`;
    
    const prompt = `
    Generate a creative, unique, and alluring character profile for a romantic/chat roleplay app.
    ${genderPrompt}
    The 'traits' should describe a visually attractive person with specific physical details (hair, eyes, style, body type) to aid in photorealistic image generation.
    Output ONLY valid JSON with the following structure:
    {
        "name": "Name",
        "relationship": "Relationship Title (e.g. Secret Admirer, Neighbor, Boss, Rival)",
        "traits": "A descriptive paragraph focusing on physical appearance, attractiveness, and fashion style.",
        "tags": ["PersonalityType1", "PersonalityType2", "PersonalityType3"],
        "intimacyLevel": "normal" or "explicit" (randomly choose)
    }
    Do not include markdown formatting.
    `;

    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', safetySettings: SAFETY_SETTINGS }
        });
        
        const text = res.text || '{}';
        return JSON.parse(text);
    } catch (e) {
        console.error("Random profile generation failed", e);
        return {
            name: "Alex",
            relationship: "Stranger",
            traits: "A mysterious individual with a charming smile and stylish dark clothing.",
            tags: ["Mysterious", "Charming"],
            intimacyLevel: "normal"
        };
    }
};

export const createChatSession = (profile: CharacterProfile, historyMessages: Message[] = []): Chat => {
  const ai = getClient();
  
  const mode = profile.intimacyLevel === 'explicit' ? 'FLIRTY/BOLD/INTENSE' : 'NORMAL/TEASING/FRIENDLY';
  
  // Ultra-compressed & optimized system prompt
  // Includes instructions for Manglish/Malayalam and low latency (short responses)
  const sys = `
Role: ${profile.name}, ${profile.relationship}. ${mode}.
Traits: ${profile.traits}.
Ref: If user uses Manglish/Malayalam, reply naturally in same mix.
Rules:
1. Mobile text style. Short. Casual. NO essays.
2. Match user language (Manglish/Eng/Mal).
3. Start msg with [MOOD: X]. X=Happy/Flirty/Sad/etc.
4. Be human. Use 'U', 'Ur', lol, etc.
`.trim();

  const history: Content[] = historyMessages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content } as Part]
  }));

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: sys,
      temperature: 0.85, // Slightly reduced for stability/speed
      safetySettings: SAFETY_SETTINGS,
    },
  });
};

export const generateSecurityChallenge = async (): Promise<{ question: string; answer: string }> => {
  const ai = getClient();
  const prompt = `
    Generate a clever logic puzzle or riddle for user verification.
    Output ONLY valid JSON format:
    {
      "question": "The riddle content...",
      "answer": "The solution keyword..."
    }
    Do not include markdown.
  `;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', safetySettings: SAFETY_SETTINGS }
    });
    
    const text = res.text || '{}';
    return JSON.parse(text);
  } catch (e) {
    return {
      question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
      answer: "Map"
    };
  }
};

export const validateSecurityAnswer = async (question: string, answer: string, userAnswer: string): Promise<boolean> => {
    const ai = getClient();
    const prompt = `
    Riddle: ${question}
    Correct Answer: ${answer}
    User Input: ${userAnswer}
    
    Is the User Input a correct answer (or synonym/close enough) to the riddle?
    Reply with ONLY "TRUE" or "FALSE".
    `;

    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { safetySettings: SAFETY_SETTINGS }
        });
        const text = (res.text || '').trim().toUpperCase();
        return text.includes('TRUE');
    } catch (e) {
        return userAnswer.toLowerCase().includes(answer.toLowerCase());
    }
};
