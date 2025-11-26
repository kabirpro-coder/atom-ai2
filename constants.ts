import { AppMode } from './types';
import { 
  Atom, 
  BookOpen, 
  Code2, 
  Feather, 
  MessageSquare 
} from 'lucide-react';

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash';
export const GEMINI_MODEL_VISION = 'gemini-2.5-flash'; // 2.5 flash is multimodal
export const GEMINI_MODEL_TTS = 'gemini-2.5-flash-preview-tts';

export const DEFAULT_SYSTEM_INSTRUCTION = `You are Atom AI, a highly advanced, intelligent, and friendly AI assistant designed to help students and professionals.
You are witty, concise, and extremely knowledgeable.
When in STUDY mode, you focus on breaking down complex topics into simple terms, providing examples, and checking for understanding.
When analyzing images, look for text, diagrams, or objects and explain them clearly.`;

export const MODE_CONFIG = {
  [AppMode.GENERAL]: {
    icon: MessageSquare,
    color: 'text-blue-400',
    prompt: "You are a helpful general assistant."
  },
  [AppMode.STUDY]: {
    icon: BookOpen,
    color: 'text-emerald-400',
    prompt: "You are an expert academic tutor. Explain concepts clearly, step-by-step, suitable for a student. If you see a math problem, solve it showing work."
  },
  [AppMode.CODING]: {
    icon: Code2,
    color: 'text-purple-400',
    prompt: "You are a senior software engineer. Provide clean, efficient, and well-documented code examples."
  },
  [AppMode.CREATIVE]: {
    icon: Feather,
    color: 'text-pink-400',
    prompt: "You are a creative writer. Use evocative language and think outside the box."
  }
};