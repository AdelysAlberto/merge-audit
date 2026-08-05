export interface GitLabProjectConfig {
  id: string;
  name: string;
}

export interface AppConfig {
  gitlab: {
    hostUrl: string;
    token: string;
    projects: GitLabProjectConfig[];
    activeProjectId?: string;
  };
  ai: {
    provider: "gemini" | "openai" | "ollama";
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
  rulesDirectoryPath: string;
}

export const defaultConfig: AppConfig = {
  gitlab: {
    hostUrl: "https://gitlab.com",
    token: "",
    projects: [
      { id: "259257", name: "CEBOR Accounts" },
      { id: "261104", name: "CEBOR Payments" },
    ],
    activeProjectId: "259257",
  },
  ai: {
    provider: "gemini",
    apiKey: "",
    model: "gemini-1.5-pro",
    baseUrl: "",
  },
  rulesDirectoryPath: "",
};
