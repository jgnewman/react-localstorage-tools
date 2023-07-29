#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const outdentFile = (pathname) => {
  const text = fs.readFileSync(pathname).toString()
  const newText = text.replace(/\n\s*/g, '\n')
  fs.writeFileSync(pathname, newText)
}

const finalize = (pathname) => {
  if (fs.existsSync(pathname)) {
    const stats = fs.lstatSync(pathname)

    if (stats.isFile() && /\.js$/.test(pathname)) {
      console.log(pathname)
      return outdentFile(pathname)
    }

    if (stats.isDirectory()) {
      const contents = fs.readdirSync(pathname)
      contents.forEach((item) => {
        finalize(path.resolve(pathname, item))
      })
    }
  }
}

console.log('Finalizing...')
finalize(path.resolve(__dirname, '../dist'))
console.log('Done.')
