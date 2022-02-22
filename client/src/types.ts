export type Message = {
  userId: string | null;
  messageText: string;
  arrivedAt: Date;
}

export type User = {
  id: string;
  username: string;
}

export const MESSAGE_TYPES = {
  USER_INFO: 'userinfo',
  USERS_LIST: 'userslist',
  MESSAGE: 'message',
  ERROR: 'error',
  USER_REGISTERED: 'userregistered',
}

export type SocketMessageUserInfoPayload = {
  user: User;
};

export type SocketMessageUsersListPayload = {
  users: User[];
}

export type SocketMessageMessagePayload = {
  userId: string;
  messageText: string;
}

export type SocketMessageErrorPayload = {
  errorMessage: string;
}

export type SocketMessage = {
  type: string;
  data: SocketMessageUserInfoPayload
  | SocketMessageUsersListPayload
  | SocketMessageMessagePayload
  | SocketMessageErrorPayload;
}

export type MessageExpanded = {
  message: Message;
  user: User | undefined;
}