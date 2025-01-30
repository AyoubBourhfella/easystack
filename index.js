#!/usr/bin/env node
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
const version = packageJson.version;

const program = new Command();

program.version(version, '-v, --version', 'Display the current version of EasyStack');

program.parse(process.argv);
async function main() {
    try {
        console.log("🚀 Welcome to EasyStack ");

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
                when: (answers) => answers.cssFramework === "Bootstrap",
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

        process.chdir(projectName);

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


                const actionsTypes = `  
export const INCREMENT = 'INCREMENT';
export const DECREMENT = 'DECREMENT';
                `;
                fs.writeFileSync('./src/store/ActionsTypes.js', actionsTypes);

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



                const appJsx = `
import React from "react";
import { Route, Routes, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
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
        } else {
            const appJsx = `
import React from "react";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";


function App() {
  return (
    <div>
      
      <Home />
    </div>
  );
}

export default App;
            `;
            fs.writeFileSync("./src/App.jsx", appJsx);
        }

        try {
            console.log("\nConfiguring main.jsx...");

            const mainJsxPath = "./src/main.jsx";
            let mainJsxContent = fs.readFileSync(mainJsxPath, "utf-8");

            if (!mainJsxContent.includes('import React from "react";')) {
                mainJsxContent = `
import React from "react";
                ` + mainJsxContent;
            }
            const reduxImports = `
import { Provider } from 'react-redux';
import { legacy_createStore } from 'redux';
import Reducer from './store/reducer';
        `;
            const reduxStore = `
const store = legacy_createStore(Reducer);
        `;

            const routerImport = `
import { BrowserRouter as Router } from 'react-router-dom';
        `;

            if (useRedux) {
                mainJsxContent = reduxImports + mainJsxContent;

                mainJsxContent = mainJsxContent.replace(
                    /createRoot\(document\.getElementById\('root'\)\)\.render\(/,
                    (match) => `${reduxStore}\n${match}`
                );
            }

            if (useRouter) {

                mainJsxContent = routerImport + mainJsxContent;

            }

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

            mainJsxContent = mainJsxContent.replace(
                /<App \/>/,
                appReplacement()
            );

            fs.writeFileSync(mainJsxPath, mainJsxContent);

            console.log("✔ main.jsx configured.");
        } catch (error) {
            console.error("❌ Failed to configure main.jsx:", error.message);
        }
        // Step 6: Create folder structure
        try {
            console.log("\nCreating folder structure...");

            const folders = [
                'src/components',
                'src/pages',
                'src/assets',
                'src/hooks',
                'src/utils',
                'src/services',
            ];

            folders.forEach(folder => {
                fs.mkdirSync(folder, { recursive: true });
            });
            // make the nav and pages 
            const navbarJsx = `
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          EasyStack
        </Link>
        <div className="navbar-links">
          <Link to="/" className="navbar-link">
            Home
          </Link>
          <Link to="/about" className="navbar-link">
            About
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;`

            if (useRouter) {
                fs.writeFileSync("./src/components/Navbar.jsx", navbarJsx);
            }
            const homePageJsx = `
import React from 'react';

const Home = () => {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to EasyStack</h1>
      <p className="home-description">This is Home Page!</p>
    </div>
  );
};

export default Home;
`;
            fs.writeFileSync("./src/pages/Home.jsx", homePageJsx);
            const aboutPageJsx = `
import React from 'react';

const About = () => {
  return (
    <div className="about-container">
      <h1 className="about-title">About Us</h1>
      <p className="about-description">Learn more about our cool application!</p>
    </div>
  );
};

export default About;
`
            fs.writeFileSync("./src/pages/About.jsx", aboutPageJsx);

            // add css 
            const indexcss = `
${cssFramework === "Tailwind CSS" ? '@import "tailwindcss";' : ""}
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}
body{
  margin: 0;
}

.navbar {
  background: linear-gradient(to right, #3b82f6, #9333ea); 
  padding: 1rem; 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
}

.navbar-container {
  max-width: 1200px; 
  margin: 0 auto; 
  display: flex;
  justify-content: space-between;
  align-items: center;
}


.navbar-logo {
  color: white;
  font-size: 1.5rem; 
  font-weight: bold;
  text-decoration: none;
  transition: color 0.3s ease;
}

.navbar-logo:hover {
  color: #e5e7eb; 
}


.navbar-links {
  display: flex;
  gap: 1rem; 
}

.navbar-link {
  color: white;
  text-decoration: none;
  transition: color 0.3s ease; 
}

.navbar-link:hover {
  color: #e5e7eb; 
}

.home-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(to bottom, #eff6ff, #f3e8ff); 
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.home-title {
  font-size: 3rem;
  font-weight: bold; 
  color: #1e3a8a; 
  margin-bottom: 1rem; 
}

.home-description {
  font-size: 1.25rem; 
  color: #374151; 
}
.about-container {
  width: 100%;
  min-height: 100vh; 
  background: linear-gradient(to bottom, #f5f3ff, #dbeafe); 
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.about-title {
  font-size: 3rem;
  font-weight: bold;
  color: #4c1d95; 
  margin-bottom: 1rem; 
}

.about-description {
  font-size: 1.25rem;
  color: #374151; 
}

`;
            fs.writeFileSync("./src/index.css", indexcss);
            console.log("✔ Folder structure created.");
        } catch (error) {
            console.error("❌ Failed to create folder structure:", error.message);
        }



        console.log("\n🎉 EasyStack setup complete! Happy coding!");
    } catch (error) {
        console.error("❌ An unexpected error occurred:", error.message);
        process.exit(1);
    }
}

if (process.argv.includes('--version') || process.argv.includes('-v')) {
    // Display the version and exit
    console.log(`EasyStack CLI Version: ${version}`);
} else {
    // Run the main function
    main();
}