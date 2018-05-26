'use strict'

const fs = require('fs')
const signale = require('signale')
const Notebook = require('../RunKitNotebook')
const { Spinner } = require('cli-spinner')

const init = async (name, options) => {

    const loader = new Spinner('%s Talking to RunKit...')
    loader.setSpinnerString(20)

    const folder = typeof name === 'string' ? name : false

    if (folder && fs.existsSync(name)) {
        return signale.fatal(new Error(`The path "${name}" already exists`))
    }

    if (!folder && fs.existsSync('.runkit')) {
        return signale.fatal(new Error(`.runkit file already exists`))
    }

    loader.start()

    const notebook = new Notebook()

    try {
        await notebook.create()
    } catch (error) {
        loader.stop(true)
        return signale.fatal(new Error('Failed to create a new notebook'))
    }

    try {
        let formated_credentials = JSON.stringify(notebook.credentials, null, 4)
        if (folder) {
            fs.mkdirSync(folder)
            fs.writeFileSync(`./${folder}/.runkit`, formated_credentials, 'utf8')
        } else {
            fs.writeFileSync('.runkit', formated_credentials, 'utf8')
        }
    } catch (error) {
        loader.stop(true)
        return signale.fatal(new Error('Failed to write'))
    }

    loader.stop(true)

    console.log('')

    if (folder) {
        let up_next = `\n\nUp Next:\n1. cd ./${folder}\n2. touch index.js\n3. runkit start\n\n`
        signale.success(`👏 Runkit notebook successuly initialized at ./${folder}${up_next}`)
    } else {
        let up_next = `\n\nUp Next:\n1. touch index.js\n2. runkit start\n\n`
        signale.success(`👏 Runkit notebook successuly initialized${up_next}`)
    }
}

module.exports = init