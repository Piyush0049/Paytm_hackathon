const { spawn, execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

const BACKEND_PORT = 8000;
const MOBILE_PORT = 8081;
const APP_PATH = path.join(__dirname, 'App.tsx');

const BE_SUBDOMAIN = `paytm-voice-api-${Math.floor(Math.random() * 90000) + 10000}`;

// Pure Localtunnel architecture - BYPASS NGROK COMPLETELY
async function killPortSafer(port) {
    return new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
            if (!stdout) return resolve();
            const lines = stdout.split('\n');
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 4 && parts[parts.length - 1] !== "0") {
                    const pid = parts[parts.length - 1];
                    try {
                        const taskInfo = execSync(`tasklist /FI "PID eq ${pid}"`).toString();
                        if (taskInfo.includes("python.exe") || (taskInfo.includes("node.exe") && pid == process.pid.toString())) {
                            continue;
                        }
                        execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
                    } catch(e){}
                }
            }
            resolve();
        });
    });
}

(async () => {
    console.log("\n=======================================================");
    console.log("🚀 PAYTM VOICEGUARD - FINAL GLOBAL MASTER STARTUP ");
    console.log("=======================================================\n");

    console.log(`🧹 Cleaning up ghost processes...`);
    await killPortSafer(MOBILE_PORT);
    await killPortSafer(BACKEND_PORT);
    try { execSync('taskkill /F /IM ngrok.exe /T', { stdio: 'ignore' }); } catch(e){}

    console.log(`📡 Provisioning Dual-Localtunnels (No Ngrok Required)...`);

    // 1. Backend: Localtunnel
    const beLt = spawn('npx', ['localtunnel', '--port', BACKEND_PORT.toString(), '--subdomain', BE_SUBDOMAIN], { shell: true });

    let beUrl = '';

    beLt.stdout.on('data', (d) => {
        const m = d.toString().match(/https:\/\/[^\s]+/);
        if (m) { beUrl = m[0]; console.log(`✅ Backend API ready at: ${beUrl}`); checkReady(); }
    });

    function checkReady() {
        if (beUrl) {
            console.log(`🔧 Syncing App.tsx with Global API...`);
            let content = fs.readFileSync(APP_PATH, 'utf8');
            content = content.replace(/const BACKEND_TUNNEL = 'https:\/\/.*';/g, `const BACKEND_TUNNEL = '${beUrl}';`);
            fs.writeFileSync(APP_PATH, content);

            console.log(`📲 Starting Expo Server via Ngrok Tunnel...`);
            
            // Start Expo directly with --tunnel flag which uses Ngrok natively and bypasses the warning!
            // This ignores localtunnel for mobile, fixing the QR scanning issue immediately.
            const env = { 
                ...process.env
            };

            spawn('npx', ['expo', 'start', '--tunnel'], { stdio: 'inherit', shell: true, env });
        }
    }
})();
