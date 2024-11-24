const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => {
        const validChannels = [
            'set-window', 'get-lab-id', 'get-computer-id', 'set-lab-id',
            'minimize-app', 'maximize-app', 'exit-fullscreen', 'enter-fullscreen', 'enter-fullscreen-admin',
            'network-status', 'quit-app', 'enable-network', 'disable-network'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    invoke: (channel, ...args) => {
        const validChannels = [
            'set-window', 'get-lab-id', 'get-computer-id', 'set-lab-id',
            'minimize-app', 'maximize-app', 'exit-fullscreen', 'enter-fullscreen', 'enter-fullscreen-admin',
            'check-network', 'enable-network', 'disable-network', 'restart-app', 'quit-app', 'recheck-network'
        ];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
        return Promise.reject(new Error('Invalid channel'));
    },
    on: (channel, callback) => {
        const validChannels = [
            'update-status', 'network-status', 'network-recheck-status',
            'network-enabled', 'network-disabled'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },
    removeAllListeners: (channel) => {
        const validChannels = [
            'update-status', 'network-status', 'network-recheck-status',
            'network-enabled', 'network-disabled'
        ];
        if (validChannels.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    }
});