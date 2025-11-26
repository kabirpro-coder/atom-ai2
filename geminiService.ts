import { GoogleGenAI, Modality } from "@google/genai";
import { Attachment, Role, WebSource, MapSource } from "../types";
import { GEMINI_MODEL_TEXT, GEMINI_MODEL_TTS } from "../constants";

const getClient = () => {
  // STRICT REQUIREMENT: Only use process.env.API_KEY
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing from process.env.API_KEY");
    throw new Error("API Key configuration error. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Text & Multimodal Generation ---

interface GenResponse {
  text: string;
  webSources: WebSource[];
  mapSources: MapSource[];
}

export const generateResponse = async (
  prompt: string,
  attachments: Attachment[],
  systemInstruction: string,
  userLocation?: { latitude: number; longitude: number }
): Promise<GenResponse> => {
  const ai = getClient();
  
  const parts: any[] = [];

  // Add attachments
  attachments.forEach(att => {
    parts.push({
      inlineData: {
        mimeType: att.mimeType,
        data: att.data
      }
    });
  });

  // Add text prompt
  parts.push({ text: prompt });

  // Configure Tools (Search and Maps)
  const tools: any[] = [{ googleSearch: {} }, { googleMaps: {} }];
  
  // Configure Tool Config (Location)
  let toolConfig: any = undefined;
  if (userLocation) {
    toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        }
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
        toolConfig: toolConfig
      }
    });

    const text = response.text || "I couldn't generate a response.";
    
    // Extract Grounding Metadata
    const webSources: WebSource[] = [];
    const mapSources: MapSource[] = [];

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        webSources.push({
          uri: chunk.web.uri,
          title: chunk.web.title
        });
      }
      if (chunk.maps) {
        mapSources.push({
          uri: chunk.maps.uri,
          title: chunk.maps.title || "View on Maps"
        });
      }
    });

    return { text, webSources, mapSources };
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    throw error;
  }
};

// --- Text to Speech (TTS) ---

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const speakText = async (text: string, voiceName: string = 'Kore') => {
  const ai = getClient();

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const ctx = getAudioContext();
    const outputNode = ctx.createGain();
    outputNode.connect(ctx.destination);

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      ctx,
      24000,
      1
    );

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputNode);
    source.start();

  } catch (error) {
    console.error("TTS Error:", error);
  }
};