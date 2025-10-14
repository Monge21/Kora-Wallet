#!/usr/bin/env node

const { spawn } = require('node:child_process')

const env = { ...process.env }
const PORT = process.env.PORT || 3000;

;(async() => {
  // Prerender si quieres
  if (process.argv.includes('start')) {
    await exec(`npx next build --experimental-build-mode generate`)
  }

  // Lanza Next directamente con el puerto correcto
  await exec(`npx next start -p ${PORT}`)
})()

function exec(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit', env })
  return new Promise((resolve, reject) => {
    child.on('exit', code => {
      if (code === 0) resolve()
      else reject(new Error(`${command} failed rc=${code}`))
    })
  })
}

