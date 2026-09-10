import * as conf from "./conf.js";
export const envs = {
    GITLAB: {
        TOKEN: conf.GITLAB_TOKEN,
        HOST_URL: conf.GITLAB_HOST_URL,
        GE_TOKEN: conf.GITLAB_GE_TOKEN,
    },
    COPILOT: {
        TOKEN: conf.COPILOT_TOKEN_IA,
        BASE_URL: conf.COPILOT_BASE_URL,
        MODEL: conf.COPILOT_MODEL,
        USE_GITLAB_TOKEN: conf.USE_GITLAB_TOKEN_FOR_COPILOT,
    },
    AI: {
        PROVIDER: conf.ENV_AI_PROVIDER,
        MODEL: conf.ENV_AI_MODEL,
    },
};
export default envs;
export * from "./conf.js";
