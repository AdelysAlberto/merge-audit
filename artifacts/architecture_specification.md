# 🧬 Especificación de Arquitectura Técnica: GitLab AI MR Reviewer

> **Arquitecto de Sistemas**: Sheldon Cooper | **Orquestación**: El Profesor

---

## 📐 1. Principios Arquitectónicos Fundamentalistas

*¡Bazinga! La arquitectura debe ser determinista, libre de imperfecciones de orientación a objetos (cero `class`, cero `this`) y construida mediante funciones puras compuestas.*

### 🛠️ Reglas Inviolables de Código
1. **Código Funcional Puro**: Prohibido el uso de `class`, `this`, `extends` o cualquier artefacto de Programación Orientada a Objetos. Todo el dominio se modela con interfaces TypeScript, funciones puras y factory functions.
2. **Screaming Architecture / Vertical Slicing**: El código vive estrictamente agrupado por módulo funcional dentro de `src/main/modules/` y `src/renderer/modules/`.
3. **Manejo de Errores con Result Pattern**: Prohibido el uso de `throw` en servicios de negocio. Todas las operaciones asíncronas retornan `Result<T, E>`.
4. **Zustand con Selectores Atómicos**: En la capa Renderer, consumo de stores de Zustand exclusivamente a través de selectores con `useShallow`.
5. **Estilos**: Vanilla CSS Modules exclusivamente (sin Tailwind ni estilos inline).
6. **Linter & Formatter**: Biome (`@biomejs/biome`) para formateo y análisis estático con cero sobrecarga.

---

## 🏗️ 2. Stack Tecnológico y Componentes

- **Runtime & Contenedor**: Electron 33+ (Node.js en Main Process + Chromium en Renderer Process).
- **Lenguaje**: TypeScript 5.7+ en modo ultra-estricto (`strict: true`).
- **Bundler & Build Pipeline**: Vite 6+ con `vite-plugin-electron` y `vite-plugin-electron-renderer`.
- **Linter & Formatter**: Biome (`@biomejs/biome`).
- **Cliente HTTP**: Axios para consumo de GitLab REST API v4 y llamadas a REST APIs de proveedores de IA.
- **Gestión de Estado (Renderer)**: Zustand 4.5+.
- **Estilos UI**: CSS Modules nativos + CSS Custom Properties (Design Tokens).

---

## 🗂️ 3. Arquitectura de Módulos (Vertical Slicing)

```text
gitlab-ai-mr-reviewer/
├── biome.json
├── package.json
├── vite.config.ts
├── electron-builder.json
├── artifacts/
│   ├── prd.md
│   ├── ux_specification.md
│   ├── architecture_specification.md
│   └── technical_standards.md
├── src/
│   ├── main/
│   │   ├── index.ts                     # Punto de entrada Electron Main Process
│   │   ├── preload.ts                   # ContextBridge e IPC Exposed API
│   │   └── modules/
│   │       ├── config/
│   │       │   ├── configStore.ts       # Lectura/escritura de configuración del usuario
│   │       │   └── configTypes.ts
│   │       ├── rulesManager/
│   │       │   ├── rulesService.ts      # Escaneo y copia de archivos .md en ~/.config/merge-audit/rules/
│   │       │   └── rulesTypes.ts
│   │       ├── aiProvider/
│   │       │   ├── aiFactory.ts         # Factory para instanciar el cliente IA (Gemini, OpenAI, Ollama)
│   │       │   ├── geminiAdapter.ts
│   │       │   ├── openaiAdapter.ts
│   │       │   ├── ollamaAdapter.ts
│   │       │   └── aiTypes.ts
│   │       ├── conventionAuditor/
│   │       │   ├── titleAuditor.ts      # Validador de formato de título MR y Commits
│   │       │   └── auditorTypes.ts
│   │       ├── gitlab/
│   │       │   ├── gitlabClient.ts      # Integración con GitLab API REST v4
│   │       │   └── gitlabTypes.ts
│   │       └── logger/
│   │           └── loggerStream.ts      # Streamer de logs IPC hacia Renderer
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── modules/
│   │   │   ├── mrList/
│   │   │   │   ├── components/
│   │   │   │   └── mrListStore.ts
│   │   │   ├── aiReport/
│   │   │   │   ├── components/
│   │   │   │   └── aiReportStore.ts
│   │   │   ├── settings/
│   │   │   │   ├── components/
│   │   │   │   └── settingsStore.ts
│   │   │   └── logTerminal/
│   │   │       ├── components/
│   │       │   └── logTerminalStore.ts
│   │   └── shared/
│   │       ├── i18n/
│   │       │   ├── es.json
│   │       │   └── useI18n.ts
│   │       └── styles/
│   │           ├── tokens.css
│   │           └── global.css
│   └── shared/
│       ├── types/
│       │   └── result.ts                # Def de Result<T, E> y utilidades ok() / err()
│       └── utils/
│           └── regexUtils.ts
```

---

## 📡 4. Contratos de Datos y APIs Internas

### 4.1 Tipos de Configuración del Usuario (`Config`)
```typescript
export interface AppConfig {
  gitlab: {
    hostUrl: string;       // ej: "https://gitlab.com"
    token: string;         // Personal Access Token
    projects: { id: string; name: string }[];
  };
  ai: {
    provider: 'gemini' | 'openai' | 'ollama';
    apiKey: string;
    model: string;         // ej: "gemini-1.5-pro", "gpt-4o", "llama3"
    baseUrl?: string;
  };
  rulesDirectoryPath: string; // ej: "~/.config/merge-audit/rules"
}
```

### 4.2 Esquema de Auditoría de Convenciones (`TitleAuditor`)
```typescript
export interface ConventionAuditResult {
  mrTitle: {
    isValid: boolean;
    rawTitle: string;
    taskId?: string;
    portal?: string;
    module?: string;
    type?: string;
    shortDescription?: string;
    errorReason?: string;
  };
  commits: {
    sha: string;
    message: string;
    isValid: boolean;
    errorReason?: string;
  }[];
  isAllValid: boolean;
}
```

### 4.3 Esquema de Evaluación por IA (`AiEvaluationResult`)
```typescript
export interface AiEvaluationResult {
  confidenceScore: number; // 0.00 a 1.00
  verdict: 'APPROVE' | 'NEEDS_CHANGES' | 'REJECT';
  summary: string;
  risks: {
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    file?: string;
    line?: number;
  }[];
  ruleViolations: {
    ruleFileName: string;
    message: string;
  }[];
  highlights: string[];
}
```

---

## ⚙️ 5. Canales de Comunicación IPC (Electron Main <-> Renderer)

| Canal IPC | Tipo | Dirección | Descripción |
| :--- | :--- | :--- | :--- |
| `config:get` | Invoke | Renderer -> Main | Obtiene la configuración actual guardada |
| `config:save` | Invoke | Renderer -> Main | Guarda la nueva configuración del usuario |
| `rules:list` | Invoke | Renderer -> Main | Lista los archivos `.md` de reglas presentes en la carpeta |
| `rules:add` | Invoke | Renderer -> Main | Abre diálogo o copia un archivo `.md` a la carpeta de reglas |
| `rules:delete` | Invoke | Renderer -> Main | Elimina un archivo de regla `.md` |
| `gitlab:fetchMrs` | Invoke | Renderer -> Main | Obtiene la lista de MRs abiertas de un proyecto |
| `gitlab:fetchMrDetails`| Invoke | Renderer -> Main | Obtiene diffs y commits de un MR específico |
| `ai:evaluateMr` | Invoke | Renderer -> Main | Ejecuta la evaluación de IA inyectando reglas `.md` y diffs |
| `logger:log` | Event | Main -> Renderer | Stream continuo de logs hacia la Terminal de la UI |

---

## 🛠️ 6. Motor Reusable de Proveedores de IA (`AiFactory`)

El módulo `aiFactory.ts` utiliza el patrón Factory Funcional para crear adaptadores unificados:

```typescript
export type AiAdapter = {
  evaluate: (payload: {
    mrTitle: string;
    diffs: string;
    commits: string[];
    rulesContent: string;
  }) => Promise<Result<AiEvaluationResult, string>>;
};

export const createAiAdapter = (config: AppConfig['ai']): AiAdapter => {
  switch (config.provider) {
    case 'gemini':
      return createGeminiAdapter(config);
    case 'openai':
      return createOpenAiAdapter(config);
    case 'ollama':
      return createOllamaAdapter(config);
    default:
      return createGeminiAdapter(config);
  }
};
```
