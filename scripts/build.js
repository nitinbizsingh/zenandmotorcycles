const fse = require('fs-extra')
const path = require('path')
const ejs = require('ejs')
const { promisify } = require('util')
const ejsRenderFile = promisify(ejs.renderFile)
const globP = promisify(require('glob'))
const config = require('../site.config')
const marked = require('marked')

const srcPath = './src'
const distPath = './public'

// clear destination folder
fse.emptyDirSync(distPath)

// copy assets folder
fse.copy(`${srcPath}/assets`, `${distPath}/assets`)

// copy data folder
fse.copy(`${srcPath}/data`, `${distPath}/data`)

// read page templates
globP('**/*.@(ejs|md)', { cwd: `${srcPath}/pages` })
  .then((files) => {
    files.forEach((file) => {
      const fileData = path.parse(file)
      const destPath = path.join(distPath, fileData.dir)

      // create destination directory
      fse.mkdirs(destPath)
        .then(() => {
          
          // read page file
          return fse.readFile(`${srcPath}/pages/${file}`, 'utf-8')
        })
        .then((data) => {
          
          // generate page content according to file type
          let pageContent
          
          switch (fileData.ext) {
            case '.md':
              pageContent = marked(data)
              break
            case '.ejs':
              pageContent = ejs.render(data, config)
              break
            default:
              pageContent = data
          }

          return ejsRenderFile(`${srcPath}/layout.ejs`, Object.assign({}, config, { body: pageContent }))
        })
        .then((layoutContent) => {
          // save the html file
          fse.writeFile(`${destPath}/${fileData.name}.html`, layoutContent)
        })
        .catch((err) => { console.error(err) })
    })
  })
  .catch((err) => { console.error(err) })