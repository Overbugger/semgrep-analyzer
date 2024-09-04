import express, { Request, Response } from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import simpleGit from "simple-git";

// Initialize the Express app
const app = express();
app.use(express.json());

const git = simpleGit();
const TEMP_DIR = path.join(__dirname, "temp");

// Helper function to clone the GitHub repository dynamically
async function cloneRepository(gitUrl: string): Promise<string> {
  const repoName = gitUrl.split("/").pop()?.replace(".git", "") || "repo";
  const repoPath = path.join(TEMP_DIR, repoName);

  // Remove any previous clone of the repository
  if (fs.existsSync(repoPath)) {
    fs.rmSync(repoPath, { recursive: true, force: true });
  }

  // Clone the repository
  await git.clone(gitUrl, repoPath);
  return repoPath;
}

// Helper function to run Semgrep on the cloned repository
function runSemgrep(directory: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `semgrep --config=auto ${directory} --json`,
      (error, stdout, stderr) => {
        if (error) {
          reject(`Error running Semgrep: ${stderr}`);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

// POST /analyze: Endpoint to receive a GitHub repository URL for analysis
app.post("/analyze", async (req: Request, res: Response) => {
  const { gitUrl } = req.body;

  if (!gitUrl) {
    return res
      .status(400)
      .json({ error: "Please provide a gitUrl in the request body." });
  }

  try {
    // Step 1: Clone the repository dynamically
    const repoPath = await cloneRepository(gitUrl);

    // Step 2: Run Semgrep on the cloned codebase
    const semgrepOutput = await runSemgrep(repoPath);

    // Step 3: Parse and return the vulnerabilities found
    const vulnerabilities = JSON.parse(semgrepOutput);

    // Send back the results
    res.json({ vulnerabilities });

    // Step 4: Cleanup the cloned repository
    fs.rmSync(repoPath, { recursive: true, force: true });
  } catch (error: any) {
    res.status(500).json({ error: `Analysis failed: ${error.message}` });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
