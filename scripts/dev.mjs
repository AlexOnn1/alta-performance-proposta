import { spawn } from 'node:child_process';

const processes = [
  spawn(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.react.json', '--watch', '--preserveWatchOutput'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'serve', ...process.argv.slice(2)], { stdio: 'inherit' }),
];

function stop(code) {
  process.exitCode = code;
  for (const child of processes) child.kill();
}

for (const child of processes) {
  child.on('exit', (code) => {
    if (!processes.every((process) => process.killed)) stop(code ?? 0);
  });
  child.on('error', (error) => {
    console.error(error);
    stop(1);
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
