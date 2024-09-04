"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const simple_git_1 = __importDefault(require("simple-git"));
// Initialize the Express app
const app = (0, express_1.default)();
app.use(express_1.default.json());
const git = (0, simple_git_1.default)();
const TEMP_DIR = path_1.default.join(__dirname, "temp");
// Helper function to clone the GitHub repository dynamically
function cloneRepository(gitUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const repoName = ((_a = gitUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.replace(".git", "")) || "repo";
        const repoPath = path_1.default.join(TEMP_DIR, repoName);
        // Remove any previous clone of the repository
        if (fs_1.default.existsSync(repoPath)) {
            fs_1.default.rmSync(repoPath, { recursive: true, force: true });
        }
        // Clone the repository
        yield git.clone(gitUrl, repoPath);
        return repoPath;
    });
}
// Helper function to run Semgrep on the cloned repository
function runSemgrep(directory) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(`semgrep --config=auto ${directory} --json`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error running Semgrep: ${stderr}`);
            }
            else {
                resolve(stdout);
            }
        });
    });
}
// POST /analyze: Endpoint to receive a GitHub repository URL for analysis
app.post("/analyze", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { gitUrl } = req.body;
    if (!gitUrl) {
        return res
            .status(400)
            .json({ error: "Please provide a gitUrl in the request body." });
    }
    try {
        // Step 1: Clone the repository dynamically
        const repoPath = yield cloneRepository(gitUrl);
        // Step 2: Run Semgrep on the cloned codebase
        const semgrepOutput = yield runSemgrep(repoPath);
        // Step 3: Parse and return the vulnerabilities found
        const vulnerabilities = JSON.parse(semgrepOutput);
        // Send back the results
        res.json({ vulnerabilities });
        // Step 4: Cleanup the cloned repository
        fs_1.default.rmSync(repoPath, { recursive: true, force: true });
    }
    catch (error) {
        res.status(500).json({ error: `Analysis failed: ${error.message}` });
    }
}));
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
