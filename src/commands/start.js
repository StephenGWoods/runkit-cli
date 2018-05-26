'use strict'

const fs = require('fs')
const signale = require('signale')
const browserify = require('browserify')
const { Spinner } = require('cli-spinner')
const Notebook = require('../RunKitNotebook')

function getMatches(string, regex, index) {
    index || (index = 1); // default to the first capturing group
    var matches = [];
    var match;
    while (match = regex.exec(string)) {
        matches.push(match[index]);
    }
    return matches;
}


const start = async (file, options) => {
    if (typeof file !== 'string') {
        file = 'index.js'
    }

    const loader = new Spinner('%s Talking to RunKit...')

    loader.setSpinnerString(20)

    if (!fs.existsSync('.runkit')) {
        return signale.fatal(new Error('.runkit file was not found, try runkit init'))
    }

    if (!fs.existsSync(file)) {
        return signale.fatal(new Error(`File ${file} dose not exists`))
    }

    const credentials = JSON.parse(fs.readFileSync('.runkit', 'utf8'))
    const notebook = new Notebook(credentials)

    signale.info('Bundling...')

    browserify(file, { bare: true, browserField: false, bundleExternal: false }).bundle(async (error, buf) => {
        if (error) {
            return signale.fatal(new Error('Failed to bundle!'))
        }

        let code = 'var ___originalRequire = require;' + buf.toString()
            .replace(/\(require,module,exports\)/gim, '(require,module,_exports)')
            .replace(`var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a`, 'var a = ___originalRequire(i);if(a){return a;}')

        let packages = getMatches(code, /require\(['"`](.+)[`"']\)/gim, 1).filter(pack => pack.startsWith('.') === false && pack.startsWith('@runkit') === false)

        notebook.setSource(code, packages)

        loader.start()

        try {
            await notebook.save()
        } catch (error) {
            loader.stop(true)
            return signale.fatal(new Error('Failed to save notebook, server respond with status ' + error.statusCode))
        }

        loader.stop(true)

        signale.success(`Endpoint is live at ${notebook.endpoint}`)
    })
}

module.exports = start