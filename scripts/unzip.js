const AdmZip = require('adm-zip')
const path = require('path')

function unzip() {
  const zip = new AdmZip(path.resolve(__dirname, '../dist.zip'))
  zip.extractAllTo(path.resolve(__dirname, '../dist'), true)
}

unzip()
