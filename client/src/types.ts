export type User = {
  id: string;
  username: string;
}

export type Message = {
  user: User;
  messageText: string;
  arrivedAt: Date;
}

export const MESSAGE_TYPES = {
  USER_INFO: 'userinfo',
  MESSAGE: 'message',
  ERROR: 'error',
  USER_REGISTERED: 'userregistered',
}

export type SocketMessageUserInfoPayload = {
  user: User;
};

export type SocketMessageMessagePayload = {
  user: User;
  messageText: string;
}

export type SocketMessageErrorPayload = {
  errorMessage: string;
}

export type SocketMessage = {
  type: string;
  data: SocketMessageUserInfoPayload
  | SocketMessageMessagePayload
  | SocketMessageErrorPayload;
}
