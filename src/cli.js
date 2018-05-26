'use strict'

const commander = require('commander')
const { INIT, START, LOGS } = require('./commands')

commander.command('init').action(INIT)
commander.command('start').action(START)
commander.command('logs').action(LOGS)

module.exports = commander