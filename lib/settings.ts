export type AppSettings = {
  provider: "gemini" | "openai";
  model: string;
  apiKey: string;
  currency: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  quotePrefix: string;
  defaultVat: number;
  autoSave: boolean;
};

export const defaultSettings: AppSettings = {
  provider: "gemini",
  model: "gemini-3.8-flash",
  apiKey: "",
  currency: "VND",
  companyName: "WOTU",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  quotePrefix: "BG-WOTU",
  defaultVat: 0,
  autoSave: true,
};
