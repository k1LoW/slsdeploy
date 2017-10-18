'use strict';

const console = require('console');
const ejs = require('ejs');
const fs = require('fs');
const archiver = require('archiver');
const AWS = require('aws-sdk');
const codebuild = new AWS.CodeBuild({
    apiVersion: '2016-10-06'
});
const s3 = new AWS.S3({
    apiVersion: '2006-03-01'
});
const bucketName = process.env.SLSDEPLOY_LOGS_S3_BUCKET_NAME;
const serviceRole = `${process.env.SLSDEPLOY_SERVICE_NAME}-${process.env.SLSDEPLOY_STAGE}-${process.env.SLSDEPLOY_REGION}-CodeBuildIamRole`;
const buildLocationPrefix = 'builds/';
const buildLogLocationPrefix = 'logs/';
const qs = require('qs');

module.exports.handler = (event, context, callback) => {
    const owner = decodeURIComponent(event.pathParameters.owner);
    const repo = decodeURIComponent(event.pathParameters.repo);
    const branch = event.queryStringParameters && event.queryStringParameters.hasOwnProperty('branch') ? event.queryStringParameters.branch : 'master';

    const env = qs.parse(event.body);
    const hash = `${(new Date).getTime()}-${owner}-${repo}-${branch}`;

    const data = {
        owner: owner,
        repo: repo,
        branch: branch,
        env: env,
        hash: hash,
        host: event.headers.Host,
        stage: process.env.SLSDEPLOY_STAGE
    };

    const zipPath = `/tmp/${hash}.zip`;
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip');

    // listen for all archive data to be written
    output.on('close', () => {
        const params = {
            Bucket: bucketName,
            Key: `${buildLocationPrefix}${hash}.zip`,
            Body: new Buffer(fs.readFileSync(zipPath), 'binary')
        };
        s3.putObject(params).promise()
            .then(() => {
                const params = {
                    artifacts: { /* required */
                        type: 'NO_ARTIFACTS' /* required */
                    },
                    environment: {
                        computeType: 'BUILD_GENERAL1_SMALL', /* required */
                        image: 'aws/codebuild/nodejs:6.3.1', /* required */
                        type: 'LINUX_CONTAINER', /* required */
                        privilegedMode: false
                    },
                    name: hash, /* required */
                    source: { /* required */
                        type: 'S3', /* required */
                        // buildspec: 'STRING_VALUE',
                        location: `${bucketName}/${buildLocationPrefix}${hash}.zip`
                    },
                    serviceRole: serviceRole
                };
                return codebuild.createProject(params).promise();
            })
            .then((res) => {
                const params = {
                    projectName: res.project.name
                };
                return codebuild.startBuild(params).promise();
            })
            .then(() => {
                const data = {
                    hash: hash,
                    out: '==== PROVISIONING ===='
                };
                const params = {
                    Bucket: bucketName,
                    Key: `${buildLogLocationPrefix}${hash}.json`,
                    Body: JSON.stringify(data, null, 2),
                    ContentType: 'application/json'
                };
                return s3.putObject(params).promise();
            })
            .then(() => {
                const response = {
                    statusCode: 302,
                    headers: {
                        'Content-Type': 'text/html',
                        'Location': `../status/${hash}`
                    },
                    body: 'Redirect'
                };
                callback(null, response);
            })
            .catch((err) => {
                console.error(err);
                const response = {
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'text/html'
                    },
                    body: 'Build error'
                };
                callback(null, response);
            });
    });

    archive.on('warning', (err) => {
        console.error(err);
    });

    archive.on('error', (err) => {
        console.error(err);
    });

    archive.pipe(output);

    const buffer = new Buffer(ejs.render(fs.readFileSync(__dirname + '/buildspec.yml').toString('utf-8'), data));
    archive.append(buffer, { name: 'buildspec.yml' });

    archive.finalize();
};
