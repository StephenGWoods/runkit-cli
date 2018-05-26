'use strict'

const fs = require('fs')
const signale = require('signale')
const { Spinner } = require('cli-spinner')
const Notebook = require('../RunKitNotebook')

const logs = async (options) => {
    const loader = new Spinner('%s Fetching logs...')

    loader.setSpinnerString(20)

    if (!fs.existsSync('.runkit')) {
        return signale.fatal(new Error('.runkit file was not found, try runkit init'))
    }

    const credentials = JSON.parse(fs.readFileSync('.runkit', 'utf8'))
    const notebook = new Notebook(credentials)

    loader.start()

    try {
        const logs = await notebook.logs()
        loader.stop(true)

        if (!logs.items) {
            return signale.fatal(new Error('Invalid server response'))
        }

        fs.writeFileSync('endpoint-logs.json', JSON.stringify(logs.items, null, 4), 'utf8')

        signale.success(`Successuly fetches ${logs.items.length} logs into ./endpoint-logs.json`)
    } catch (error) {
        loader.stop(true)
        return signale.fatal(new Error('Failed to save notebook'))
    }
}

module.exports = logs