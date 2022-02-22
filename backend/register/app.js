const AWS = require('aws-sdk');
const {
  v4: uuidv4,
} = require('uuid');

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: process.env.AWS_REGION });

const { USERS_TABLE_NAME, CONNECTIONS_TABLE_NAME } = process.env;

const MESSAGE_TYPES = {
  USER_INFO: 'userinfo',
  USERS_LIST: 'userslist',
  MESSAGE: 'message',
  ERROR: 'error',
}

exports.handler = async event => {
  const { username } = JSON.parse(event.body);
  const { connectionId } = event.requestContext;

  if (!username) {
    return { statusCode: 400, body: { message: 'username is required' } };
  }

  let user;

  try {
    // At first, register user in separate table
    const queryResult = await ddb.query({
      TableName: USERS_TABLE_NAME,
      IndexName: 'username-index',
      Limit: 1,
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username
      }
    }).promise();

    if (!queryResult?.Items?.length) {
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
    } else {
      user = queryResult.Items[0];
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

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  try {
    const message = {
      type: MESSAGE_TYPES.USER_INFO,
      data: {
        user,
      }
    }
  
    await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(message) }).promise();
  } catch (e) {
    if (e.statusCode === 410) {
      console.log(`Found stale connection, deleting ${connectionId}`);
      await ddb.delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId } }).promise();
    } else {
      console.error(e);
    }
  }

  return { statusCode: 200, body: 'User registered.' };
};
