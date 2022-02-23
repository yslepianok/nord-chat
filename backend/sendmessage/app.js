const AWS = require('aws-sdk');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });
let apigwManagementApi;

const { CONNECTIONS_TABLE_NAME, USERS_TABLE_NAME } = process.env;

const MESSAGE_TYPES = {
  USER_INFO: 'userinfo',
  USERS_LIST: 'userslist',
  MESSAGE: 'message',
  ERROR: 'error',
  USER_REGISTERED: 'userjoined',
}

const getAllConnections = async () => {
  return ddb.scan({ TableName: CONNECTIONS_TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
}

const findConnectionUser = async (connectionId) => {
  const queryResponse = await ddb.get({
    TableName: CONNECTIONS_TABLE_NAME,
    Key: { connectionId },
    ProjectionExpression: 'connectionId, userId',
  }).promise();

  return queryResponse?.Item
    ? queryResponse.Item
    : null;
}

const findUser = async (id) => {
  const queryResponse = await ddb.get({
    TableName: USERS_TABLE_NAME,
    Key: { id },
    ProjectionExpression: 'id, username',
  }).promise();

  return queryResponse?.Item
    ? queryResponse.Item
    : null;
}

const findUserByName = async (username) => {
  const queryResponse = await ddb.query({
    TableName: USERS_TABLE_NAME,
    IndexName: 'username-index',
    Limit: 1,
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: {
      ':username': username
    }
  }).promise();

  return queryResponse?.Items?.length
    ? queryResponse.Items[0]
    : null;
}

const sendOne = async (connectionId, message) => {
  return apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(message) }).promise();
}

const sendAll = async (message) => {
  try {
    connectionData = await getAllConnections();
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: e };
  }

  const promises = connectionData.Items.map(async ({ connectionId }) => {
    try {
      return apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(message) }).promise();
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

  return Promise.all(promises);
}

exports.handler = async event => {
  if (!apigwManagementApi) {
    apigwManagementApi = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });
  }

  const { connectionId } = event.requestContext;
  let currentUser;

  try {
    currentUser = await findConnectionUser(connectionId);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  if (!currentUser) {
    const errorMessage = 'Only registered users could send messages';
    const message = {
      type: MESSAGE_TYPES.ERROR,
      data: {
        errorMessage,
      }
    }

    await sendOne(connectionId, message);
    return { statusCode: 200, body: errorMessage };
  }

  const { userId } = currentUser;

  const dbUser = await findUser(userId);

  const { messageText } = JSON.parse(event.body);
  const message = {
    type: MESSAGE_TYPES.MESSAGE,
    data: {
      user: dbUser,
      messageText,
    },
  }

  try {
    await sendAll(message);
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: 'Data sent.' };
};
