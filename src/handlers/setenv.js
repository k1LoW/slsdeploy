'use strict';

const axios = require('axios');
const ejs = require('ejs');
const fs = require('fs');
const yaml = require('js-yaml');

module.exports.handler = (event, context, callback) => {
    const owner = decodeURIComponent(event.pathParameters.owner);
    const repo = decodeURIComponent(event.pathParameters.repo);
    const branch = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('branch') ? event.queryStringParameters.branch : 'master';

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/.slsdeploy.yml`;

    axios.get(url)
        .then((res) => {
            const data = {
                branch: branch,
                inputs: yaml.safeLoad(res.data)
            };
            const response = {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html'
                },
                body: ejs.render(fs.readFileSync(__dirname + '/../templates/setenv.html').toString('utf-8'), data)
            };
            callback(null, response);
        })
        .catch((err) => {
            console.error(err);
            const response = {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html'
                },
                body: `<h1>Can not get/parse ${url}</h1>`
            };
            callback(null, response);
        });
};
