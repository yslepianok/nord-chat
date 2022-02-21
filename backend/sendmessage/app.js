const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const { CONNECTIONS_TABLE_NAME } = process.env;

exports.handler = async event => {
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  const { connectionId } = event.requestContext;
  let connectionData;
  let currentUser;

  try {
    currentUser = await ddb.get({
      TableName: CONNECTIONS_TABLE_NAME,
      Key: { connectionId },
      ProjectionExpression: 'connectionId, userId',
    }).promise();
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  console.log('123123123', currentUser);

  const { userId } = currentUser?.Item;

  if (!userId) {
    const message = 'Only registered users could send messages';
    await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify({ message }) }).promise();
    return { statusCode: 200, body: message };
  }

  try {
    connectionData = await ddb.scan({ TableName: CONNECTIONS_TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: e };
  }

  const { messageText } = JSON.parse(event.body);

  const message = {
    userId,
    messageText,
  }

  const postCalls = connectionData.Items.map(async ({ connectionId }) => {
    try {
      await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(message) }).promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        await ddb.delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId } }).promise();
      } else {
        console.error(e);
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};
