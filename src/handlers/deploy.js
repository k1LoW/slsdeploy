'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    apiVersion: '2006-03-01'
});
const exec = require('node-exec-promise').exec;
const bucketName = process.env.SLSDEPLOY_LOGS_S3_BUCKET_NAME;

module.exports.handler = (event, context, callback) => {
    const owner = event.owner;
    const repo = event.repo;
    const branch = event.branch;
    const env = event.env;
    const hash = event.hash;

    let data = event;
    delete data.env;
    data.out = [];

    process.env.HOME = '/tmp';
    process.env.AWS_ACCESS_KEY_ID = '';
    process.env.AWS_SECRET_ACCESS_KEY = '';
    process.env.AWS_SESSION_TOKEN = '';
    Object.keys(env).forEach((k) => {
        process.env[k] = env[k];
    });

    const response = {
        statusCode: 200,
        body: JSON.stringify({})
    };
    callback(null, response);

    let objectParams = {
        Bucket: bucketName,
        Key: `${hash}.json`,
        Body: data,
        ContentType: 'application/json'
    };
    Promise.resolve()
        .then(() => {
            return exec(`curl -L -o /tmp/repo.zip "https://github.com/${owner}/${repo}/archive/${branch}.zip" && unzip /tmp/repo.zip -d /tmp/src`);
        })
        .then((out) => {
            data.out.push({
                command: `$ curl -L -o /tmp/repo.zip "https://github.com/${owner}/${repo}/archive/${branch}.zip" && unzip /tmp/repo.zip -d /tmp/src`,
                stdout: out.stdout
            });
            objectParams.Body = JSON.stringify(data);
            return s3.putObject(objectParams).promise()
                .then(() => {
                    return exec(`cd /tmp/src/${repo}-${branch} && npm install && npm install serverless --save`);
                });
        })
        .then((out) => {
            data.out.push({
                command: `$ cd /tmp/src/${repo}-${branch} && npm install && npm install serverless --save`,
                stdout: out.stdout
            });
            objectParams.Body = JSON.stringify(data);
            return s3.putObject(objectParams).promise()
                .then(() => {
                    return exec(`cd /tmp/src/${repo}-${branch} && ./node_modules/.bin/sls deploy || true`);
                });
        })
        .then((out) => {
            data.out.push({
                command: '$ ./node_modules/.bin/sls deploy',
                stdout: out.stdout
            });
            objectParams.Body = JSON.stringify(data);
            return s3.putObject(objectParams).promise()
                .then(() => {
                    return Promise.resolve(true);
                });
        })
        .then(() => {
            console.log('Deploy end.');
        })
        .catch((err) => {
            console.error(err);
            throw err;
        });
};
