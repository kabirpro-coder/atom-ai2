export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export enum MediaType {
  IMAGE = 'image/png',
  AUDIO = 'audio/wav',
  PDF = 'application/pdf'
}

export interface Attachment {
  data: string; // Base64
  mimeType: string;
  name?: string;
}

export interface WebSource {
  uri: string;
  title: string;
}

export interface MapSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
  isError?: boolean;
  webSources?: WebSource[];
  mapSources?: MapSource[];
}

export interface AppSettings {
  useTTS: boolean;
  themeColor: string; // Tailwind color name like 'cyan', 'purple', 'emerald'
  userName: string;
  voice: string;
}

export enum AppMode {
  GENERAL = 'General Helper',
  STUDY = 'Study Partner',
  CODING = 'Coding Assistant',
  CREATIVE = 'Creative Writer'
}