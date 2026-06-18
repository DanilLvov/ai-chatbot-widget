# ai-chatbot-widget
Embeddable AI chat widget built with React and Node.js.


---
 
## Prerequisites
 
- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher
- Google Chrome
---
 
## Setup
 
### 1. Install dependencies
 
From the project root, install both the root and frontend dependencies:
 
```bash
# Root (server dependencies)
npm install
 
# Frontend
cd widget-app
npm install
```
 
### 2. Build the extension
 
```bash
# Inside widget-app/
npm run build
```
 
This generates the `widget-app/dist/` folder — the built extension Chrome will load.
 
### 3. Load the extension in Chrome
 
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `widget-app/dist/` folder
5. The extension icon will appear in your Chrome toolbar
### 4. Start the backend server
 
```bash
# From the project root
node server.js
```
 
The server runs on `http://localhost:3000` by default.
 
---
 
## Development Workflow
 
### Rebuilding after changes
 
Every time you edit the frontend, rebuild and refresh the extension:
 
```bash
# Inside widget-app/
npm run build
```
 
Then go to `chrome://extensions/` and click the **refresh icon** (↺) on the extension card.
 
### Watch mode (auto-rebuild)
 
```bash
# Inside widget-app/
npm run build -- --watch
```
 
> You still need to manually refresh the extension in `chrome://extensions/` after each rebuild — Chrome does not hot-reload extensions automatically.
---