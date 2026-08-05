# 🤖 Estándares Técnicos, Clean Architecture y Scaffolding: merge-audit

> **Tech Lead**: Vicky | **Orquestación**: El Profesor

---

## 🏛️ 1. Principios Inviolables de Calidad de Código

### 1.1 Estructura y Código Funcional Puro
- **Prohibición Total de POO**: No se permite el uso de `class`, `this`, `extends` ni mutable prototypes. Todo el código de negocio se implementa mediante interfaces TypeScript y funciones puras o cierres (*closures* / *factory functions*).
- **Result Pattern en Lugar de Throw**: Los servicios de red, I/O de archivos o interacción con APIs externas no deben lanzar excepciones de forma directa (`throw`). Retornan siempre el tipo `Result<T, E>` definido en `src/shared/types/result.ts`.

```typescript
// src/shared/types/result.ts
export type Ok<T> = { ok: true; data: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });
```

---

## 📦 2. Zustand & Selectores Atómicos (`useShallow`)

- Prohibido desestructurar el store completo en los componentes de React.
- Obligatorio utilizar `useShallow` para evitar renders innecesarios.

```typescript
// ❌ INCORRECTO
const { mrList, selectedMrId, selectMr } = useMrStore();

// ✅ CORRECTO
const { mrList, selectedMrId } = useMrStore(
  useShallow((state) => ({
    mrList: state.mrList,
    selectedMrId: state.selectedMrId,
  }))
);
const selectMr = useMrStore((state) => state.selectMr);
```

---

## 🎨 3. Convención de Estilos (CSS Modules)

- Usar exclusivamente CSS Modules (*.module.css*) por componente.
- Usar Design Tokens CSS declarados en `src/renderer/shared/styles/tokens.css`.
- Prohibido TailwindCSS y prohibidos los estilos inline.

```css
/* src/renderer/shared/styles/tokens.css */
:root {
  --bg-primary: #0b0f19;
  --bg-card: rgba(17, 24, 39, 0.75);
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --color-success: #00e676;
  --color-warning: #ffea00;
  --color-danger: #ff1744;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

## 🌐 4. Internacionalización (i18n)

- Ningún texto visible al usuario final debe escribirse como hardcoded string.
- Todos los textos deben consumirse mediante el hook `t('clave')` definido en `src/renderer/shared/i18n/useI18n.ts` con diccionario base en `es.json`.

---

## ⚡ 5. Configuración de Linter y Formatter (`biome.json`)

Se utiliza Biome (`@biomejs/biome`) para formateo y verificación estática de código de alta velocidad:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useConst": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

---

## 🧪 6. Protocolo de Verificación Obligatorio Pre-Commit

Antes de dar por finalizada cualquier tarea o módulo, es **mandatory** ejecutar y verificar con éxito la siguiente secuencia de comandos:

```bash
pnpm fix && pnpm tsc --noEmit && pnpm build
```
