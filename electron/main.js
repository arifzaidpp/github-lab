import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";
import Store from "electron-store";
import pkg from "node-machine-id";
import { spawn } from "child_process";
import connectToMongoDB from "../backend/config/db.js";
import { checkAndEnableNetworkAccess, enableNetwork, disableNetwork } from "./utils/network.js";
import { startServer } from "../backend/server.js";

const { machineId } = pkg;
const store = new Store();
let mainWindow = null;
let loadingWindow = null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Application state
let retryAttempts = 0;
let isInitializing = false;
let isRestarting = false;
let restartCount = 0;

// Constants
const MAX_RETRIES = 5;
const MAX_RESTART_COUNT = 5;
const RETRY_DELAY = 5000;
const FOCUS_CHECK_INTERVAL = 500;
const NETWORK_CHECK_INTERVAL = 10000; // Check network every 10 seconds

// Window configuration
const loadingWindowConfig = {
  width: 800,
  height: 600,
  fullscreen: true,
  frame: false,
  transparent: true,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, "preload.js"),
  },
};

const mainWindowConfig = {
  width: 1024,
  height: 768,
  fullscreen: true,
  frame: false,
  transparent: true,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    preload: path.join(__dirname, "preload.js"),
  },
};

// Network Management
let networkCheckInterval = null;

const startNetworkMonitoring = () => {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval);
  }

  networkCheckInterval = setInterval(async () => {
    const status = await checkAndEnableNetworkAccess();
    mainWindow?.webContents.send('network-status', status);
  }, NETWORK_CHECK_INTERVAL);
};

const stopNetworkMonitoring = () => {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval);
    networkCheckInterval = null;
  }
};

// IPC Handlers for Network Management
ipcMain.handle('check-network', async () => {
  try {
    return await checkAndEnableNetworkAccess();
  } catch (error) {
    return { online: false, message: error.message };
  }
});

ipcMain.handle('enable-network', async () => {
  try {
    const result = await enableNetwork();
    if (result.online) {
      mainWindow?.webContents.send('network-enabled', { success: true });
      startNetworkMonitoring();
    }
    return result;
  } catch (error) {
    return { online: false, message: error.message };
  }
});

ipcMain.handle('disable-network', async () => {
  try {
    const result = await disableNetwork();
    if (result.success) {
      mainWindow?.webContents.send('network-disabled', { success: true });
      stopNetworkMonitoring();
    }
    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Helper Functions
const getStartUrl = (route = "") => {
  return isDev
    ? `http://localhost:3000${route}`
    : `file://${path.join(__dirname, "../frontend/dist/index.html")}${route}`;
};

const showErrorDialog = async (title, message) => {
  return dialog.showMessageBox({
    type: "error",
    title,
    message,
    buttons: ["Retry", "Exit"],
    defaultId: 0,
  });
};

// Window Management
async function createLoadingWindow() {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    return loadingWindow;
  }

  try {
    loadingWindow = new BrowserWindow(loadingWindowConfig);
    const startUrl = getStartUrl("/#/loading");

    await loadingWindow.loadURL(startUrl);
    loadingWindow.setFullScreen(true);

    if (isDev) {
      loadingWindow.webContents.openDevTools();
    }

    loadingWindow.on("close", (e) => {
      if (isInitializing) {
        e.preventDefault();
      }
    });

    return true;
  } catch (error) {
    console.error("Failed to create loading window:", error);
    return false;
  }
}

async function createMainWindow() {
  try {
    mainWindow = new BrowserWindow(mainWindowConfig);
    await mainWindow.loadURL(getStartUrl());
    setupMainWindow();
    return true;
  } catch (error) {
    console.error("Failed to create main window:", error);
    return false;
  }
}

function setupMainWindow() {
  if (!mainWindow) return;

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Window settings
  mainWindow.setFullScreen(true);
  mainWindow.setKiosk(true);
  mainWindow.setResizable(false);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.setSkipTaskbar(true);
  mainWindow.setContentProtection(true);

  // Register shortcuts
  registerGlobalShortcuts();

  // Window event handlers
  setupWindowEventHandlers();

  // Focus maintenance
  maintainWindowFocus();

  // Start network monitoring
  startNetworkMonitoring();
}

// ... rest of the existing code remains the same ...

app.whenReady().then(async () => {
  await createLoadingWindow();
  await initializeApp();
});

app.on("window-all-closed", () => {
  stopNetworkMonitoring();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoadingWindow().then(() => initializeApp());
  }
});

app.on("quit", () => {
  stopNetworkMonitoring();
  globalShortcut.unregisterAll();
});