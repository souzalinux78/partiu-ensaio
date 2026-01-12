// Script para matar processos na porta 5000
const { exec } = require('child_process');
const os = require('os');

const PORT = 5000;

if (os.platform() === 'win32') {
  exec(`netstat -ano | findstr :${PORT}`, (error, stdout, stderr) => {
    if (stdout) {
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 0) {
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(pid)) {
            pids.add(pid);
          }
        }
      });
      
      if (pids.size > 0) {
        console.log(`Encontrados processos na porta ${PORT}: ${Array.from(pids).join(', ')}`);
        pids.forEach(pid => {
          exec(`taskkill /PID ${pid} /F`, (err) => {
            if (err) {
              console.error(`Erro ao matar processo ${pid}:`, err.message);
            } else {
              console.log(`Processo ${pid} encerrado`);
            }
          });
        });
      } else {
        console.log(`Nenhum processo encontrado na porta ${PORT}`);
      }
    }
  });
} else {
  exec(`lsof -ti:${PORT}`, (error, stdout, stderr) => {
    if (stdout) {
      const pids = stdout.trim().split('\n');
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, (err) => {
          if (err) {
            console.error(`Erro ao matar processo ${pid}:`, err.message);
          } else {
            console.log(`Processo ${pid} encerrado`);
          }
        });
      });
    } else {
      console.log(`Nenhum processo encontrado na porta ${PORT}`);
    }
  });
}
