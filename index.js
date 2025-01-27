#!/usr/bin/env node
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function main() {
    try {
        console.log("🚀 Welcome to EasyStack with Vite!");

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "projectName",
                message: "Enter your project name:",
                default: "my-easystack-app",
                validate: (input) => {
                    if (/^[a-zA-Z0-9_-]+$/.test(input)) {
                        return true;
                    }
                    return "Project name must only include letters, numbers, underscores, and dashes.";
                },
            },
            {
                type: "list",
                name: "cssFramework",
                message: "Choose a CSS framework:",
                choices: ["Tailwind CSS", "Bootstrap", "None"],
            },
            {
                type: "list",
                name: "bootstrapOption",
                message: "Do you want to use Bootstrap via CDN or npm?",
                choices: ["CDN", "npm"],
                when: (answers) => answers.cssFramework === "Bootstrap", // Only show this if Bootstrap is selected
            },
            {
                type: "confirm",
                name: "useRedux",
                message: "Do you want to include Redux?",
                default: true,
            },
            {
                type: "confirm",
                name: "useRouter",
                message: "Do you want to include React Router?",
                default: true,
            },
        ]);

        const { projectName, cssFramework, bootstrapOption, useRedux, useRouter } = answers;

        console.log(`\nInitializing your project: "${projectName}"...\n`);

        // Step 1: Create Vite React App
        try {
            execSync(`npm create vite@latest ${projectName} -- --template react`, { stdio: "inherit" });
        } catch (error) {
            console.error("❌ Failed to create Vite React app:", error.message);
            process.exit(1);
        }

        process.chdir(projectName); // Navigate to the project directory

        // Step 2: Install dependencies
        try {
            console.log("\nInstalling dependencies...");
            execSync("npm install", { stdio: "inherit" });
            console.log("✔ Dependencies installed.");
        } catch (error) {
            console.error("❌ Failed to install dependencies:", error.message);
            process.exit(1);
        }

        // Step 3: Install CSS Framework
        if (cssFramework === "Tailwind CSS") {
            try {
                console.log("\nInstalling Tailwind CSS...");
                execSync("npm install tailwindcss @tailwindcss/vite", { stdio: "inherit" });

                const viteConfigPath = "vite.config.js";
                const viteConfig = `
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
plugins: [
      tailwindcss(),
],
})`

                fs.writeFileSync(viteConfigPath, viteConfig);

                const cssPath = "src/index.css";
                const cssContent = `@import "tailwindcss";`;
                fs.writeFileSync(cssPath, cssContent);

                const indexHtmlPath = "./index.html";
                const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

                const updatedHtml = indexHtml.replace(`</head>`, `<link href="/dist/styles.css" rel="stylesheet"> </head>`);
                fs.writeFileSync(indexHtmlPath, updatedHtml);

                console.log("✔ Tailwind CSS installed and configured.");
            } catch (error) {
                console.error("❌ Failed to install Tailwind CSS:", error.message);
            }
        } else if (cssFramework === "Bootstrap") {
            if (bootstrapOption === "npm") {
                try {
                    console.log("\nInstalling Bootstrap via npm...");
                    execSync("npm install bootstrap", { stdio: "inherit" });
                    console.log("✔ Bootstrap installed via npm.");

                    // Import Bootstrap in main.jsx
                    const mainJsxPath = "./src/main.jsx";
                    const mainJsxContent = fs.readFileSync(mainJsxPath, "utf-8");
                    fs.writeFileSync(
                        mainJsxPath,
                        `import 'bootstrap/dist/css/bootstrap.min.css';\n${mainJsxContent}`
                    );
                } catch (error) {
                    console.error("❌ Failed to install Bootstrap via npm:", error.message);
                }
            } else if (bootstrapOption === "CDN") {
                try {
                    console.log("\nAdding Bootstrap CDN to index.html...");
                    const indexHtmlPath = "./index.html";
                    const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");
                    const bootstrapCdn = `
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-KyZXEAg3QhqLMpG8r+Knujsl5/2hb6E6b4rPBUpp2VJ1dY/SQQfP9ycZcs57tHj7" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
      `;
                    const updatedHtml = indexHtml.replace("</head>", `${bootstrapCdn}\n</head>`);
                    fs.writeFileSync(indexHtmlPath, updatedHtml);
                    console.log("✔ Bootstrap CDN added to index.html.");
                } catch (error) {
                    console.error("❌ Failed to add Bootstrap CDN:", error.message);
                }
            }
        }

        // Step 4: Install Redux
        if (useRedux) {
            try {
                console.log("\nInstalling Redux...");
                execSync("npm install redux react-redux", { stdio: "inherit" });
                console.log("✔ Redux installed.");



                fs.mkdirSync('./src/store', { recursive: true });


                // Create actions.js
                const actionsTypes = `  
              export const INCREMENT = 'INCREMENT';
              export const DECREMENT = 'DECREMENT';
                `;
                fs.writeFileSync('./src/store/ActionsTypes.js', actionsTypes);
                // Create actions.js
                const actionsJs = `  
              import { INCREMENT, DECREMENT } from './ActionsTypes';
            
              export const increment = () => ({
                type: INCREMENT,
              });
              
              export const decrement = () => ({
                type: DECREMENT,
              });
                `;
                fs.writeFileSync('./src/store/Actions.js', actionsJs);

                // Create reducer.js
                const reducerJs = `
              import { INCREMENT, DECREMENT } from './ActionsTypes';
              
              const initialState = {
                counter: 0,
              };
              
              const Reducer = (state = initialState, action) => {
                switch (action.type) {
                  case INCREMENT:
                    return { ...state, counter: state.counter + 1 };
                  case DECREMENT:
                    return { ...state, counter: state.counter - 1 };
                  default:
                    return state;
                }
              };
              
              export default Reducer;
                `;
                fs.writeFileSync('./src/store/reducer.js', reducerJs);



                console.log("✔ Redux store configured.");
            } catch (error) {
                console.error("❌ Failed to set up Redux:", error.message);
            }
        }

        // Step 5: Install React Router
        if (useRouter) {
            try {
                console.log("\nInstalling React Router...");
                execSync("npm install react-router-dom", { stdio: "inherit" });
                console.log("✔ React Router installed.");



                // Create simple routes in App.jsx
                const appJsx = `
import React from "react";
import { Route, Routes, Link } from "react-router-dom";

function App() {
  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/about" element={<h1>About</h1>} />
      </Routes>
    </div>
  );
}

export default App;
`;
                fs.writeFileSync("./src/App.jsx", appJsx);

                console.log("✔ React Router configured.");
            } catch (error) {
                console.error("❌ Failed to set up React Router:", error.message);
            }
        }

        try {
            console.log("\nConfiguring main.jsx...");
        
            const mainJsxPath = "./src/main.jsx";
            let mainJsxContent = fs.readFileSync(mainJsxPath, "utf-8");
        
            if(!mainJsxContent.includes('import React from "react";')){
                mainJsxContent = `
import React from "react";
                ` + mainJsxContent;
            }
            // Define Redux imports and store creation
            const reduxImports = `
import { Provider } from 'react-redux';
import { legacy_createStore } from 'redux';
import Reducer from './store/reducer';
        `;
            const reduxStore = `
const store = legacy_createStore(Reducer);
        `;
        
            // Define Router import
            const routerImport = `
import { BrowserRouter as Router } from 'react-router-dom';
        `;
        
            // Step 1: Insert Redux imports if Redux is selected
            if (useRedux) {
                // Insert Redux imports at the top
                mainJsxContent = reduxImports + mainJsxContent;
        
                // Insert store creation right before createRoot
                mainJsxContent = mainJsxContent.replace(
                    /createRoot\(document\.getElementById\('root'\)\)\.render\(/,
                    (match) => `${reduxStore}\n${match}`
                );
            }
        
            // Step 2: Insert Router import if Router is selected
            if (useRouter) {
               
                    mainJsxContent = routerImport + mainJsxContent;
                
            }
        
            // Step 3: Wrap the App component with Redux Provider and/or Router
            const appReplacement = () => {
                let wrapWithProviderAndRouter = "<App />";
        
                if (useRedux && useRouter) {
                    wrapWithProviderAndRouter = `
<Provider store={store}>
    <Router>
        <App />
    </Router>
</Provider>`;
                } else if (useRedux) {
                    wrapWithProviderAndRouter = `
<Provider store={store}>
    <App />
</Provider>`;
                } else if (useRouter) {
                    wrapWithProviderAndRouter = `
<Router>
    <App />
</Router>`;
                }
        
                return wrapWithProviderAndRouter;
            };
        
            // Step 4: Replace the <App /> component render part with wrapped components
            mainJsxContent = mainJsxContent.replace(
                /<App \/>/,
                appReplacement()
            );
        
            // Step 5: Write the updated content back to main.jsx
            fs.writeFileSync(mainJsxPath, mainJsxContent);
        
            console.log("✔ main.jsx configured.");
        } catch (error) {
            console.error("❌ Failed to configure main.jsx:", error.message);
        }
        
        


        console.log("\n🎉 EasyStack setup complete! Happy coding!");
    } catch (error) {
        console.error("❌ An unexpected error occurred:", error.message);
        process.exit(1);
    }
}

main().catch((err) => console.error(err));