# 👗 Especificación UX/UI y Diseño de Interfaz: GitLab AI MR Reviewer

> **Diseñadora Lead**: Edna Moda | **Orquestación**: El Profesor

---

## 🎨 1. Filosofía de Diseño: "¡Sin Capas, Querido!"

*¡Minimalismo dramático, elegancia oscura y usabilidad impoluta! Nada de elementos redundantes ni interfaces abarrotadas.*

### 🎭 Identidad Visual
- **Tema Base**: Dark Mode Profundo (`#0b0f19`) enriquecido con paneles de vidrio esmerilado (*glassmorphism*) (`rgba(17, 24, 39, 0.75)`, `backdrop-filter: blur(12px)`).
- **Tipografía**:
  - UI General: **Inter** / Sans-Serif moderna (limpia, legible).
  - Terminal de Logs, Código y Diffs: **JetBrains Mono** / Monospace de alta precisión.
- **Micro-interacciones y Feedback Visual**:
  - Bordes sutiles iluminados en hover (`border: 1px solid rgba(255,255,255,0.1)`).
  - Botón "Analizar con IA" con efecto de pulso luminoso en gradiente violeta/cyan (`#7c3aed` a `#06b6d4`).
  - Animación suave de apertura para la Terminal de Logs y el Modal de Configuración.

---

## 🎨 2. Paleta de Colores y Semántica

| Estado / Indicador | Color Hex | Propósito Visual |
| :--- | :--- | :--- |
| **Fondo Principal** | `#0b0f19` | Fondo oscuro de la aplicación |
| **Panel Esmerilado** | `#111827` + `blur(12px)` | Superficie de tarjetería y contenedores |
| **Texto Primario** | `#f9fafb` | Lectura principal |
| **Texto Secundario** | `#9ca3af` | Etiquetas y subtítulos |
| **Alta Confianza IA (`0.85` - `1.00`)** | `#00e676` | Verde neón brillante - *Listo para Merge* |
| **Confianza Media IA (`0.60` - `0.84`)** | `#ffea00` | Amarillo advertencia - *Revisión necesaria* |
| **Baja Confianza IA (`0.00` - `0.59`)** | `#ff1744` | Rojo crítico - *Riesgos detectados / Bloqueante* |
| **Convención Válida** | `#10b981` | Badge verde con checkmark para título/commits válidos |
| **Infracción Convención** | `#ef4444` | Badge rojo con icono de alerta para título/commits inválidos |
| **Fondo Terminal Logs** | `#050811` | Consola negra de alta densidad para logs |

---

## 🖥️ 3. Estructura de Pantallas y Componentes

### 3.1 Header Principal (Control Bar)
- **Logotipo & Nombre**: `merge-audit` en tipografía en negrita con badge de versión.
- **Selector de Proyecto Active**: Dropdown estilizado para cambiar entre proyectos configurados de GitLab.
- **Buscador de MRs**: Campo de búsqueda por ID de tarea `#TaskId`, autor o título.
- **Indicador de Conexión**: Punto verde pulsante (*GitLab API Online*).
- **Botón "Configurar"**: Botón secundario con icono de engranaje que abre el Modal de Configuración.

### 3.2 Sidebar Izquierda (Lista de MRs)
- **Tarjetas de MR Minimadas**:
  - **Fila Superior**: Badge de ID de Tarea (`#259257`), Badge de Pipeline (`success`, `failed`, `running`), Badge de Convención (`✓ Valid Title` o `⚠ Invalid Format`).
  - **Título del MR**: Truncado elegantemente a 2 líneas.
  - **Fila Inferior**: Autor (avatar + username), fecha de actualización, y Score de IA si ya fue evaluado (`0.92 / 1.00`).

### 3.3 Panel Central (Análisis de MR & Auditoría)
- **Sección 1: Auditoría de Convenciones de Título y Commits**:
  - Banner interactivo que desglosa el cumplimiento del estándar de título: `#<TaskId> [<Portal>] [<Module>] [<Type>] <Short description>`.
  - Desplegable de commits que marca uno a uno qué commit cumple con `#<TaskId> <type>: <description>` y cuál no.
- **Sección 2: AI Review Gauge & Summary**:
  - Indicador circular/badge radial con la puntuación de confianza de la IA.
  - **Resumen Ejecutivo**: Bloque de texto sintetizado generado por la IA.
  - **Reglas `.md` Evaluadas**: Badges que muestran qué archivos de reglas de la carpeta local fueron aplicados en la revisión.
  - **Tarjetas de Hallazgos y Riesgos**: Desglose de hallazgos ordenados por severidad (*Alta*, *Media*, *Baja*).
- **Sección 3: Visualizador de Diffs**:
  - Pestañas para alternar entre *Reporte de IA* y *Diffs de Código*.
  - Resaltado de sintaxis optimizado en modo oscuro.

### 3.4 Footer Acciones y Terminal Inferior (Console Drawer)
- **Barra de Acciones Flotante**:
  - Botón Violeta Pulsante **"Analizar con IA"** (Inicia el streaming del prompt).
  - Botón Verde **"Aprobar MR"** (Llama a GitLab Approve).
  - Botón Púrpura **"Merge MR"** (Ejecuta el merge en GitLab).
  - Botón de alternancia **"Ver Terminal Logs (Ctrl+\`)"**.
- **Terminal de Logs (Desplegable Inferior)**:
  - Consola estilo terminal con fondo `#050811`, fuente JetBrains Mono.
  - Formato de línea: `[13:45:22] [GITLAB] [INFO] Fetching 12 open merge requests from project #259257...`
  - Controles superior derecha: `Filtros` (`ALL`, `INFO`, `AI`, `WARN`, `ERROR`), `Clear`, `Auto-scroll: ON`.

### 3.5 Modal de Configuración ("Configurar")
- Modal centrado con fondo esmerilado y efecto blur.
- Pestañas horizontales de navegación:
  1. **Proyectos GitLab**: Formulario para agregar proyectos por ID o Ruta, Token de Acceso Personal, Host URL.
  2. **Proveedor de IA**: Configuración de proveedor (Gemini / OpenAI / Ollama), API Key (campo tipo password con ojo para revelar), selector de modelo (`gemini-1.5-pro`, `gpt-4o`, `llama3`), y URL Base.
  3. **Reglas (.md)**: Zona de carga de archivos (Drag & Drop o explorador de archivos). Copia automáticamente el archivo a la carpeta interna de reglas de la app (`~/.config/merge-audit/rules/`). Muestra tarjetas con cada regla cargada y botón para eliminarla.

---

## 📱 4. Responsividad y Atajos de Teclado
- `Ctrl + ,`: Abrir modal de Configuración.
- `Ctrl + \``: Alternar visibilidad de la Terminal de Logs.
- `Ctrl + R`: Refrescar MRs del proyecto actual.
- `Ctrl + Enter`: Disparar el análisis de IA sobre el MR seleccionado.
