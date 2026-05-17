# 🎨 Compra AI Layout Agent

An AI-driven chat-based layout agent that enables users to manipulate canvas coordinates, node dimensions, alignment, text styling, and preset aspects of design JSON models using natural language instructions. 

Powered by **Gemini 2.0 Flash**, this proof of concept showcases natural layout reasoning, state-preserved conversational editing, live visual rendering, and structured JSON mutations.

---

## 🚀 Key Features

*   **Stateful Chat Interface**: Converse with a persistent AI Layout Agent to apply single or multiple edits.
*   **LLM Layout Reasoning**: The agent understands the semantic meaning of layers (e.g., Background vs. Headline vs. Offer Badge vs. Product Sofa) and correctly translates requests like `"Move the offer badge higher"` or `"Keep the product large"` into concrete coordinate/dimension modifications.
*   **Layout Math Synchronization**: Seamless translation between absolute coordinates (`x`, `y`, `width`, `height`) and normalized factors (`nx`, `ny`, `nw`, `nh`) relative to the artboard dimensions.
*   **Aspect Ratio Transformation**: Conversions like `9:16` recalculate canvas scale, distribute spacing, adjust layers dynamically, and reposition overlays while ensuring items fit bounding artboards.
*   **Interactive Visual Sandbox**:
    *   **Live Wireframe Preview**: Live rendering of components (images, vector star groups, background overlays, shape badges, typography, font styling, and font weights).
    *   **Realtime JSON Output**: A beautifully colored, syntax-highlighted JSON inspector that renders the live state after every prompt.
    *   **Layer Tree View**: Hierarchical layer inspector showcasing absolute coordinates, layer order, asset names, and dimensions.

---

## 🛠️ Tech Stack & Architecture

### Frontend (Client-side)
*   **Core**: React 19 + Vite 8 (Ultra-fast HMR and building)
*   **Styling**: Pure CSS3 utilizing deep custom tokens (custom neon glows, deep obsidian colors, unified glassmorphic layers, sleek hover states, and smooth spring transitions). No rigid templates or utility pollution.
*   **Interactions**: Pure React state integration.

### Backend (Server-side)
*   **Core**: Express.js + CORS + Node.js
*   **AI Engine**: `@google/generative-ai` invoking **Gemini 2.0 Flash** (Optimized with low temperature (`0.2`) and strict system prompt guidelines for deterministic JSON structure).
*   **Context Continuity**: Stateful conversation-history payload sent to the LLM to sustain follow-up layout adjustments (e.g., *"Make it 9:16"*, followed by *"Now move the product down"*).

---

## 📂 Project Structure

```
├── server/
│   └── index.js             # Express server with Gemini layout agent reasoning
├── src/
│   ├── components/
│   │   ├── ChatPanel.jsx        # Conversational UI with preset suggestions
│   │   ├── WireframePreview.jsx # High fidelity visual wireframe canvas renderer
│   │   ├── JsonViewer.jsx       # Real-time highlighted JSON tree output
│   │   └── LayerTree.jsx        # Hierarchical layers inspector
│   ├── data/
│   │   └── designJson.js        # Seed Design JSON structure
│   ├── App.jsx              # Application state container
│   ├── index.css            # Custom Design System styling rules
│   └── main.jsx             # React DOM entry point
├── package.json             # Workspace manifest & dependencies
└── README.md                # Documentation
```

---

## 🏗️ Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Install Workspace Dependencies
In the root directory of the project, run:
```bash
npm install
```

### 3. Configure Gemini API Key
Create a `.env` file in the root directory (you can copy `.env.example`):
```bash
cp .env.example .env
```
Open the `.env` file and insert your Google AI Studio API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Run Both Frontend and Backend Concurrently
Start the unified application with a single CLI command:
```bash
npm start
```

*   **Frontend client**: Running on [http://localhost:5173/](http://localhost:5173/)
*   **Backend server**: Running on [http://localhost:3001/](http://localhost:3001/)

---

## 💡 Architectural Approach

### 1. System Prompt Guidance
Rather than building fragile regex parsers or absolute keyword triggers, the model is fed a robust **System Instruction** detailing:
*   The exact schema layout.
*   How to translate actions to coordinates (e.g. "higher" decreases `y`, "make larger" increases `width`/`height`).
*   The mathematical relationship between absolute node coordinates and normalized bounds relative to the parent artboard.
*   Instructions to return *only* valid JSON.

### 2. Follow-Up Instruction Context
Each API prompt transmits the past conversational thread alongside the latest layout. The model evaluates layout mutations sequentially, enabling intuitive conversational loops like:
1.  *"Make the headline smaller"*
2.  *"Move it to the top"* (LLM knows "it" refers to the headline from the previous context).

### 3. Differential Change Detection
The backend analyzes differences between the initial design state and the new state generated by the LLM. It isolates exactly what was moved, resized, or adjusted, and reports these actions in the chat bubble for transparent UX feed.

---

## ☁️ 1-Click Unified Production Deployment

The project has been configured for a **unified production build**. In production, the Express backend serves the pre-compiled React frontend static assets from the `dist` directory. This simplifies hosting, avoids CORS configuration issues entirely, and allows deployment to any Node.js container service in seconds.

### Deploying to Render / Railway / Heroku

1. **Connect your Repository**: Push your repository to GitHub, GitLab, or Bitbucket.
2. **Create Web Service**: Set up a new Node.js Web Service.
3. **Configure Settings**:
   * **Build Command**: `npm install && npm run build` (This installs all workspace modules and compiles the React application into `/dist`).
   * **Start Command**: `npm run start:prod` (This starts the production Express server on the assigned port, serving the React app and API endpoints concurrently).
4. **Environment Variables**:
   * Add `GEMINI_API_KEY` under the Environment tab (ensure to set your Google AI Studio API key).

---

## 🧪 Example Instructions to Try

*   `"Convert this design to 9:16 aspect ratio"`
*   `"Keep the product large and center it"`
*   `"Move the headline to the top and change color to yellow"`
*   `"Make the headline smaller"`
*   `"Move the offer badge higher and increase its size"`
