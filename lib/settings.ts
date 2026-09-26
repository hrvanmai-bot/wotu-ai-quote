export type AppSettings = {
  model: string;
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
  model: "gpt-4o-mini",
  currency: "VND",
  companyName: "WOTU",
  companyAddress: "",
  companyPhone: "",
  companyEmail: "",
  quotePrefix: "BG-WOTU",
  defaultVat: 0,
  autoSave: true,
};
