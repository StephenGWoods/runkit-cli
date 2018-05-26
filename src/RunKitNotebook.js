'use strict'

const request = require('request')

class RunKitNotebook {

    constructor(credentials) {
        this.csrf = null
        this.cookie = null
        this.request = null
        this.credentials = credentials
    }

    get endpoint() {
        return `https://${this.credentials.identifier}.runkit.sh/`
    }

    setSource(source, packages = []) {
        let dependencies = this.mutatePackages(packages)

        this.request = {
            "evaluationCount": 0,
            "content": {
                "package": {
                    "engines": {
                        "node": "8.x.x"
                    },
                    "lastEvaluatedDependencies": {},
                    "dependencies": dependencies
                },
                "title": "",
                "cells": [{
                    "_id": "cells/code",
                    "content": {
                        "type": "source",
                        "text": source,
                        "packages": {}
                    }
                }]
            }
        }

        return this
    }

    mutatePackages(packages) {
        let _packages = {}
        let time = new Date().getTime()

        packages.forEach(pack => {
            _packages[encodeURIComponent(pack)] = time
        })

        return _packages
    }

    async logs() {
        const { body } = await this.http(`/embed/${this.credentials.identifier}/logs`)
        return body
    }

    async create() {
        const { body } = await this.http('/embed/new')

        this.credentials = body

        return this
    }

    async save() {
        if (!this.credentials) {
            await this.create()
        }

        if (this.request === null) {
            throw new Error('Source was not defined')
        }

        const result = await this.http(`/embed/${this.credentials.identifier}?access-key=${this.credentials.accessKey}`, {
            method: 'PUT',
            body: this.request
        })

        if (result.body && result.body.csrf) {
            this.csrf = result.body.csrf
            return await this.save()
        }

        if (result.response.statusCode === 200) {
            return Promise.resolve()
        }

        return Promise.reject({ body: result.body, statusCode: result.response.statusCode })
    }

    http(path, args = {}) {
        return new Promise((resolve, reject) => {

            let requestConfig = {
                ...args,
                json: true,
                url: 'https://runkit.com/api' + path,
                headers: {
                    csrf: this.csrf,
                    cookie: this.cookie
                }
            }

            request(requestConfig, (error, response, body) => {
                if (error) {
                    return reject(error)
                }

                if (!this.cookie && response.headers['set-cookie']) {
                    this.cookie = Array.isArray(response.headers['set-cookie']) ? response.headers['set-cookie'][0] : response.headers['set-cookie']
                }

                resolve({ response, body })
            })
        })
    }

}

module.exports = RunKitNotebook