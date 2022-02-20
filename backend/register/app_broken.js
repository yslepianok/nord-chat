// Copyright 2018-2020Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require('aws-sdk');
const uuid = require('uuid');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const { USERS_TABLE_NAME } = process.env;

exports.handler = async event => {
  const postData = JSON.parse(event.body)?.data;

  if (!postData) {
    return { statusCode: 400, body: { message: 'request is missing or invalid' }};
  }
  const { username } = postData;

  if (!username) {
    return { statusCode: 400, body: { message: 'username is required' }};
  }
  
  try {
    const user = await ddb.get({
      TableName: USERS_TABLE_NAME,
      Key: {
        username,
      },
    }).promise()
    console.log('kek', user);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }
  
  // const apigwManagementApi = new ApiGatewayManagementApi({
  //   apiVersion: '2018-11-29',
  //   endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  // });
  
  // const postData = JSON.parse(event.body).data;
  
  // const postCalls = connectionData.Items.map(async ({ connectionId }) => {
  //   try {
  //     await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise();
  //   } catch (e) {
  //     if (e.statusCode === 410) {
  //       console.log(`Found stale connection, deleting ${connectionId}`);
  //       await ddb.delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId } }).promise();
  //     } else {
  //       throw e;
  //     }
  //   }
  // });
  
  try {
    await Promise.all([]);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};
