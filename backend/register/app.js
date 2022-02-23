const AWS = require('aws-sdk');
const {
  v4: uuidv4,
} = require('uuid');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });
let apigwManagementApi;

const { USERS_TABLE_NAME, CONNECTIONS_TABLE_NAME } = process.env;

const MESSAGE_TYPES = {
  USER_INFO: 'userinfo',
  USERS_LIST: 'userslist',
  MESSAGE: 'message',
  ERROR: 'error',
  USER_REGISTERED: 'userregistered',
}

const getAllConnections = async () => {
  return ddb.scan({ TableName: CONNECTIONS_TABLE_NAME, ProjectionExpression: 'connectionId' }).promise();
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
  const { username } = JSON.parse(event.body);
  const { connectionId } = event.requestContext;

  if (!apigwManagementApi) {
    apigwManagementApi = new AWS.ApiGatewayManagementApi({
      apiVersion: '2018-11-29',
      endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });
  }

  if (!username) {
    return { statusCode: 400, body: { message: 'username is required' } };
  }

  let user;

  try {
    // At first, register user in separate table
    user = await findUserByName(username);

    if (!user) {
      // register new user
      user = {
        id: uuidv4(),
        username,
        createdAt: new Date(),
      }

      await ddb.put({
        TableName: USERS_TABLE_NAME,
        Item: user
      }).promise();
    }
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: e };
  }

  try {
    // At second, assign current session id with this user id
    await ddb.update({
      TableName: CONNECTIONS_TABLE_NAME,
      Key: { connectionId },
      AttributeUpdates: {
        userId: {
          Action: 'PUT',
          Value: user.id,
        }
      }
    }).promise();
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: e };
  }

  try {
    const message = {
      type: MESSAGE_TYPES.USER_INFO,
      data: {
        user,
      }
    }

    await sendOne(connectionId, message);
  } catch (e) {
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${connectionId}`);
      await ddb.delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId } }).promise();
    } else {
      console.error(e);
    }
  }

  try {
    const message = {
      type: MESSAGE_TYPES.USER_REGISTERED,
      data: {
        user,
      }
    }

    await sendAll(message);  
  } catch (e) {
    console.error(e);
  }

  return { statusCode: 200, body: 'User registered.' };
};
