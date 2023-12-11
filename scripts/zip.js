const AdmZip = require('adm-zip')
const fs = require('fs')
const path = require('path')

const admZip = new AdmZip()

function addFolderToZip(folderPath, parentPath = '') {
  const files = fs.readdirSync(folderPath)
  files.forEach(file => {
    const filePath = path.join(folderPath, file)
    const targetPath = path.join(parentPath, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      addFolderToZip(filePath, targetPath)
    } else {
      admZip.addFile(targetPath, fs.readFileSync(filePath))
    }
  })
}

function zip() {
  const folderPath = path.resolve(__dirname, '../dist')
  addFolderToZip(folderPath)
  admZip.writeZip(path.resolve(__dirname, '../dist.zip'))
}

zip()
