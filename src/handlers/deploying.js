'use strict';

const ejs = require('ejs');
const fs = require('fs');
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({
    apiVersion: '2015-03-31'
});
const qs = require('qs');
const functionDeployName = 'slsdeploy-poc-deploy';

module.exports.handler = (event, context, callback) => {
    const owner = decodeURIComponent(event.pathParameters.owner);
    const repo = decodeURIComponent(event.pathParameters.repo);
    const branch = 'slsdeploy';

    const env = qs.parse(event.body);
    const hash = 'hogehoge';
    
    const data = {
        owner: owner,
        repo: repo,
        branch: branch,
        env: env,
        hash: hash
    };
    
    const lambdaParams = {
        FunctionName: functionDeployName,
        InvocationType: 'Event',
        Payload: JSON.stringify(data)
    };
    
    lambda.invoke(lambdaParams).promise()
        .then(() => {
            return Promise.resolve(true);
        }).catch((err) => {
            console.error(err);
            throw err;
        });
    
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html'
        },
        body: ejs.render(fs.readFileSync(__dirname + '/deploying.html').toString('utf-8'), data)
    };
    callback(null, response);
};
