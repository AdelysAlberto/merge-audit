# 📋 Product Requirements Document (PRD): GitLab AI MR Reviewer & Orchestrator

> **Orquestación Estratégica**: El Profesor | **Product Manager**: Roz | **UI/UX**: Edna Moda | **Arquitectura**: Sheldon Cooper | **Tech Lead**: Vicky

---

## 🎯 1. Visión y Objetivos del Producto

El **GitLab AI MR Reviewer & Orchestrator** (versión `merge-audit`) es una aplicación de escritorio nativa construida con Electron y TypeScript que automatiza, estandariza y potencia el proceso de revisión de Merge Requests en proyectos de software.

### 💡 Objetivos Clave
1. **Monitoreo Multiproyecto de GitLab**: Permitir la configuración dinámica de múltiples proyectos de GitLab (self-hosted o GitLab.com) para visualizar sus MRs abiertas en tiempo real.
2. **Proveedor de IA Reusable y Flexible**: Soportar múltiples motores de IA (Google Gemini, OpenAI, Ollama/Local LLM) con configuración de API Keys y modelos de forma agnóstica.
3. **Gestión Dinámica de Reglas de Revisión (`.md`)**: Permitir importar archivos `.md` con reglas del equipo o convenciones de código a una carpeta local de configuración (`~/.config/merge-audit/rules/`), inyectando automáticamente estas directivas en el prompt de evaluación de la IA.
4. **Auditoría Estricta de Convenciones de Título y Commits**:
   - **Título de MR**: Debe cumplir estrictamente `#<TaskId> [<Portal>] [<Module>] [<Type>] <Short description>`.
   - **Commits**: Deben seguir Conventional Commits con TaskId: `#<TaskId> <type>: <description>`.
5. **Terminal de Logs Integrada en Vivo**: Consola integrada en la app Electron para visualizar en tiempo real todos los eventos de la aplicación (fetch de MRs, llamadas a la API de IA, auditorías de títulos, approvals, errores y más).
6. **Acción en 1-Clic**: Capacidad de Aprobar MRs, realizar Merges o publicar el reporte de la IA como comentario en GitLab.

---

## 👥 2. Historias de Usuario Relevantes

- **Como Tech Lead**, quiero configurar mis proyectos de GitLab y añadir archivos `.md` con nuestras reglas de negocio y Clean Code para que la IA evalúe las MRs con los estándares propios de mi equipo.
- **Como Desarrollador / Reviewer**, quiero ver instantáneamente si el título de un MR o alguno de sus commits no cumple con el estándar `#TaskId [Portal] [Module] [Type]` antes de perder tiempo revisando.
- **Como Reviewer**, quiero seleccionar cualquier proveedor de IA (Gemini, OpenAI, Ollama) para ejecutar la revisión sin quedar atado a un solo vendor.
- **Como Desarrollador**, quiero ver una terminal de logs integrada dentro de la aplicación para diagnosticar llamadas a la API de GitLab o errores en las respuestas de la IA sin abrir devtools externas.

---

## 📐 3. Especificación Funcional de Módulos

### 3.1 Módulo de Configuración ("Configurar")
- Modal/Drawer accesible desde el Header con 3 pestañas:
  1. **GitLab Projects**: URL de la instancia de GitLab, Personal Access Token (PAT), y lista de IDs o paths de proyectos a monitorear (`ej: 259, group/repo`).
  2. **AI Provider**: Selección del proveedor (`gemini`, `openai`, `ollama`), API Key, Nombre del modelo (`gemini-1.5-pro`, `gpt-4o`, `llama3`), y URL Base opcional (para Ollama o APIs personalizadas).
  3. **Rules Manager (Archivos `.md`)**: Selector para copiar archivos `.md` desde la máquina del usuario hacia la carpeta interna de reglas de la aplicación. Muestra lista de reglas cargadas y su vista previa.

### 3.2 Módulo de Auditoría de Convenciones
- **Regla para Título de MR**:
  - Regex: `^#(?<taskId>\d+)\s+\[(?<portal>PRIVATE|PUBLIC|[A-Z0-9_-]+)\]\s+\[(?<module>[A-Za-z0-9_-]+)\]\s+\[(?<type>FEAT|FIX|REFACTOR|TEST|CHORE)\]\s+(?<description>.+)$`
- **Regla para Commits**:
  - Regex: `^#(?<taskId>\d+)\s+(?<type>feat|fix|refactor|test|chore|style|docs|perf|ci|build|revert):\s+(?<description>.+)$`
- **Comprobación Automática**: Cada MR cargado analiza el título principal y el historial de commits del MR. Muestra un badge visual de cumplimiento (*"Conforme"* en verde, o *"Infracción de Convención"* en rojo con desglose de causas).

### 3.3 Módulo de Evaluación por IA
- Combina:
  1. Información del MR (Título, Autor, Descripción, Diffs, Commits).
  2. Contenido acumulado de los archivos `.md` de reglas cargados en la configuración.
- Retorna un resultado JSON estructurado:
  - `confidenceScore`: Valor de `0.00` a `1.00`.
  - `verdict`: `APPROVE`, `NEEDS_CHANGES`, o `REJECT`.
  - `summary`: Resumen conciso del cambio.
  - `risks`: Lista de riesgos detectados con severidad (`HIGH`, `MEDIUM`, `LOW`).
  - `ruleViolations`: Lista de reglas `.md` no cumplidas en los diffs.
  - `highlights`: Aspectos positivos del código.

### 3.4 Terminal de Logs Integrada
- Consola inferior colapsable en la app Renderer.
- Recibe eventos vía IPC Event Stream (`logger:log`).
- Muestra marca de tiempo, nivel (`INFO`, `WARN`, `ERROR`, `AI`, `GITLAB`), origen del log y mensaje.
- Incluye controles de autoscroll, botón de limpiar logs y filtro de búsqueda por texto.

---

## 🎨 4. Criterios de Aceptación
- Configuración persistente en disco en `appData`.
- Copia automática y segura de archivos `.md` seleccionados a `~/.config/merge-audit/rules/`.
- Validación instantánea de títulos de MR y commits según la normativa enviada al equipo.
- Logs en vivo mostrados en la consola integrada para todas las acciones ejecutadas.
- Cobertura completa con TypeScript estricto, Biome linter, Result Pattern y arquitectura sin clases (`class`/`this`).
