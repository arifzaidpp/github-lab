import { exec } from 'child_process';
import sudo from "sudo-prompt";
import dns from 'dns';
import os from 'os';

const NETWORK_CHECK_TIMEOUT = 5000;
const DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

const checkDNS = () => {
  return new Promise((resolve) => {
    dns.resolve('google.com', (err) => {
      resolve(!err);
    });
  });
};

const pingServer = () => {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' 
      ? 'ping -n 1 8.8.8.8' 
      : 'ping -c 1 8.8.8.8';
    
    exec(command, (error) => {
      resolve(!error);
    });
  });
};

const checkNetworkInterface = () => {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? 'netsh interface show interface name="Ethernet"'
      : 'nmcli device status';
    
    exec(command, (error, stdout) => {
      if (error) {
        resolve(false);
        return;
      }
      
      const isEnabled = process.platform === 'win32'
        ? stdout.toLowerCase().includes('enabled')
        : stdout.toLowerCase().includes('connected');
      
      resolve(isEnabled);
    });
  });
};

export const checkAndEnableNetworkAccess = async () => {
  try {
    // Check if network interface is enabled
    const interfaceEnabled = await checkNetworkInterface();
    
    if (!interfaceEnabled) {
      return { 
        online: false, 
        message: 'Network interface is disabled',
        needsEnable: true 
      };
    }

    // Try DNS resolution first (fastest)
    const dnsAvailable = await checkDNS();
    if (dnsAvailable) {
      return { online: true };
    }

    // If DNS fails, try ping
    const pingAvailable = await pingServer();
    if (pingAvailable) {
      return { online: true };
    }

    return { 
      online: false, 
      message: 'No internet connection available',
      needsEnable: false
    };
  } catch (error) {
    return { 
      online: false, 
      message: error.message,
      needsEnable: false
    };
  }
};

export const enableNetwork = async () => {
  try {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      command = `netsh interface set interface "Ethernet" enable`;
    } else if (platform === 'darwin') {
      command = 'networksetup -setnetworkserviceenabled Ethernet on';
    } else if (platform === 'linux') {
      command = 'nmcli device connect eth0';
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    await new Promise((resolve, reject) => {
      sudo.exec(command, { name: "Lab Management Software" }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    // Wait for network to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return await checkAndEnableNetworkAccess();
  } catch (error) {
    return { 
      online: false, 
      message: 'Failed to enable network interface',
      needsEnable: false
    };
  }
};

export const disableNetwork = async () => {
  try {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      command = `netsh interface set interface "Ethernet" disable`;
    } else if (platform === 'darwin') {
      command = 'networksetup -setnetworkserviceenabled Ethernet off';
    } else if (platform === 'linux') {
      command = 'nmcli device disconnect eth0';
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    await new Promise((resolve, reject) => {
      sudo.exec(command, { name: "Lab Management Software" }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      message: 'Failed to disable network interface',
      error: error.message
    };
  }
};