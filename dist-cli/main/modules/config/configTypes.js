export const defaultConfig = {
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
