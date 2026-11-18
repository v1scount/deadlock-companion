const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");

const HOST = "127.0.0.1";
const PORT = 3210;
const APP_URL = `http://${HOST}:${PORT}`;

/** @type {import('node:child_process').ChildProcess | null} */
let serverProcess = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;
let quitting = false;

function standaloneDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "standalone");
  }
  return path.join(__dirname, "..", ".next", "standalone");
}

function startServer() {
  const dir = standaloneDir();
  const serverJs = path.join(dir, "server.js");
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    HOSTNAME: HOST,
    PORT: String(PORT),
  };

  serverProcess = spawn(process.execPath, [serverJs], {
    cwd: dir,
    env,
    stdio: "inherit",
    windowsHide: true,
  });

  serverProcess.on("exit", (code, signal) => {
    serverProcess = null;
    if (!quitting) {
      console.error(
        `Next standalone server exited (code=${code}, signal=${signal})`,
      );
    }
  });
}

function waitForServer(timeoutMs = 60_000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(APP_URL, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${APP_URL}`));
          return;
        }
        setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

function stopServer() {
  if (!serverProcess) return;
  const child = serverProcess;
  const pid = child.pid;
  serverProcess = null;

  if (process.platform === "win32" && pid) {
    spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
    return;
  }

  child.kill();
  setTimeout(() => {
    if (!child.killed) {
      try {
        child.kill("SIGKILL");
      } catch {
        // Already gone.
      }
    }
  }, 1500);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: "Deadlock Companion",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(APP_URL);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startServer();
  try {
    await waitForServer();
  } catch (error) {
    console.error(error);
    stopServer();
    app.quit();
    return;
  }
  createWindow();
});

app.on("before-quit", () => {
  quitting = true;
  stopServer();
});

app.on("window-all-closed", () => {
  quitting = true;
  stopServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0 && !quitting) {
    createWindow();
  }
});
