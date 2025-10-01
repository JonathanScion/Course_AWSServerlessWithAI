const { spawn } = require('child_process');
const path = require('path');

// Start the server with debugging
const server = spawn('node', ['--inspect=9229', 'index.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Give server time to start
setTimeout(() => {
  // Start the React client
  const client = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BROWSER: 'none' }
  });

  // Handle exit
  process.on('SIGINT', () => {
    server.kill();
    client.kill();
    process.exit();
  });
}, 2000);