# 🚀 MergeAudit (`merge-audit`)

**GitLab AI MR Reviewer & Orchestrator**
*Aplicación de escritorio nativa para automatizar, auditar y elevar la calidad de los Merge Requests en GitLab.*

---

## 📌 Nombres Propuestos para la Aplicación

Si deseas renombrar la aplicación o elegir una identidad comercial/branding, aquí tienes una lista de propuestas categorizadas:

1. **MergeAudit** *(Nombre actual de compilación)*: Directo, claro y profesional. Enfocado en la auditoría y cumplimiento de estándares en MRs.
2. **GitLab MergePulse AI**: Destaca el monitoreo continuo en vivo y el análisis impulsado por inteligencia artificial.
3. **PulseMR / MRPulse**: Nombre corto, dinámico y moderno. Transmite la idea de evaluar el "pulso" y estado de los Merge Requests.
4. **GitSentry AI / GitReviewer**: Enfilado al control de calidad, seguridad y gobernanza de código.
5. **PinkyMerge / PinkyReviewer**: Siguiendo la identidad y temáticas de agentes de desarrollo del ecosistema Team Pinky.

---

## 📖 Descripción General y Arquitectura Técnica
gi
**MergeAudit** es una aplicación de escritorio nativa desarrollada con **Electron**, **React** y **TypeScript**, diseñada para Tech Leads, revisores y equipos de desarrollo que utilizan GitLab. 

La herramienta conecta tus proyectos de GitLab (tanto cloud como self-hosted) con motores de Inteligencia Artificial (Google Gemini, OpenAI, Ollama/LLMs locales) y aplica un motor de auditoría estricto sobre convenciones de código y títulos de tareas.

### 💡 Características Principales

* 🔄 **Monitoreo Multiproyecto en Tiempo Real**: Configuración dinámica de proyectos GitLab para rastrear y filtrar Merge Requests abiertos.
* 🤖 **Soporte Multi-Proveedor de IA**: Integración agnóstica con Google Gemini, OpenAI y Ollama (LLM local).
* 📋 **Gestión Dinámica de Reglas (`.md`)**: Carga e inyección automática de archivos Markdown con normas de Clean Code o reglas de arquitectura del equipo en el prompt de la IA.
* 🔍 **Auditoría Estricta de Convenciones**:
  * **Títulos de MR**: Validación mediante Regex con formato `#<TaskId> [<Portal>] [<Module>] [<Type>] <Descripción>`.
  * **Commits**: Validación de formato Conventional Commits con Id de Tarea `#<TaskId> <type>: <description>`.
* 🖥️ **Terminal Integrada en Vivo**: Consola integrada dentro de la propia interfaz para supervisar peticiones API, eventos de GitLab, ejecuciones de IA y logs de auditoría sin necesidad de abrir herramientas externas.
* ⚡ **Acciones Directas en 1-Clic**: Publicación del reporte de la IA como comentario oficial en GitLab, aprobación de MRs y ejecución de Merges.

---

## 🛠️ Requisitos Previos

Antes de instalar y ejecutar **MergeAudit**, asegúrate de contar con:

* **Node.js**: `v18.0.0` o superior.
* **pnpm**: `v8.0.0` o superior (Recomendado).
* **GitLab Personal Access Token (PAT)**: Con permisos `api` y `read_repository`.

---

## 📦 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd merge-audit
```

### 2. Instalar dependencias
```bash
pnpm install
```

---

## 🚀 Uso en Desarrollo y Ejecución

### Ejecutar la aplicación en modo desarrollo
Para iniciar la interfaz de React junto con el proceso principal de Electron y hot-reload:

```bash
pnpm app:dev
```

### Verificación de Tipos y Linter
```bash
# Verificación de tipos en TypeScript
pnpm typecheck

# Formateo y linter con Biome
pnpm lint
pnpm fix
```

---

## 🏗️ Compilación y Empaquetado para Producción

La aplicación utiliza `electron-builder` para generar ejecutables nativos distribribuibles.

### Empaquetar para Linux (DEB y AppImage)
```bash
pnpm dist:linux
```
Los binarios se generarán en el directorio `release/`.

### Empaquetar para Windows (NSIS y Portable)
```bash
pnpm dist:win
```

### Empaquetado genérico
```bash
pnpm dist
```

---

## ⚙️ Configuración Inicial en la Aplicación

Al abrir la aplicación por primera vez:

1. Haz clic en el botón de **Configuración** (icono de engranaje ⚙️) en la barra superior.
2. **GitLab**:
   * Introduce la URL de tu instancia de GitLab (ejemplo: `https://gitlab.com` o tu instancia self-hosted).
   * Ingresa tu **Personal Access Token (PAT)**.
   * Agrega los IDs o paths de los proyectos que deseas monitorear.
3. **Proveedor de IA**:
   * Selecciona el proveedor (`Gemini`, `OpenAI` u `Ollama`).
   * Configura la **API Key** y el modelo a utilizar (`gemini-1.5-pro`, `gpt-4o`, etc.).
4. **Reglas de Equipo (`.md`)**:
   * Importa o gestiona tus archivos Markdown con los lineamientos de código de tu empresa.

---

## 📄 Licencia y Autores

* **Desarrollador / Mantenimiento**: Adelys Belén (`adalbeca@gmail.com`)
