export type Message = {
  userId: string | null;
  messageText: string;
  arrivedAt: Date;
}

export type User = {
  userId: string;
  username: string;
}

export const MESSAGE_TYPES = {
  USER_INFO: 'userinfo',
  USERS_LIST: 'userslist',
  MESSAGE: 'message',
  ERROR: 'error',
}

const SOCKET_ROUTES = {
  REGISTER: 'register',
  SEND_MESSAGE: 'sendmessage',
}

type SocketMessageUserInfoPayload = {
  user: User;
};

type SocketMessageUsersListPayload = {
  users: User[];
}

type SocketMessageMessagePayload = {
  userId: string;
  messageText: string;
}

type SocketMessageErrorPayload = {
  errorMessage: string;
}

// This one describes what we receive by sockets
export type SocketMessage = {
  type: string;
  data: SocketMessageUserInfoPayload
      | SocketMessageUsersListPayload
      | SocketMessageMessagePayload
      | SocketMessageErrorPayload;
}

export class ChatSocketService {
  private socket: WebSocket;
  private eventCallbacks: Map<string, (() => void)[]>
  private static instance: ChatSocketService;
  public messages: Message[];
  public users: User[];
  public currentUser: User | null;

  static getInstance() {
    if (!ChatSocketService.instance) {
      ChatSocketService.instance = new ChatSocketService();
    }

    return ChatSocketService.instance;
  }

  public register(username: string) {
    this.socket.send(JSON.stringify({ 
      action: SOCKET_ROUTES.REGISTER,
      username,
    }));
  }

  public sendMessage(messageText: string) {
    this.socket.send(JSON.stringify({
      action: SOCKET_ROUTES.SEND_MESSAGE,
      messageText,
    }));
  }

  public subscribeUpdates(messageType: string, callback: () => void) {
    if (!this.eventCallbacks.has(messageType)) {
      this.eventCallbacks.set(messageType, []);
    }

    this.eventCallbacks.get(messageType)?.push(callback);
  }

  private constructor() {
    this.messages = [];
    this.users = [];
    this.currentUser = null;

    const endpoint = process.env.REACT_APP_SOCKET_API_URL;

    console.log('Endpoint: ', endpoint);

    this.socket = new WebSocket(`wss://${endpoint}`);
    this.socket.addEventListener('message', (messageEvent: MessageEvent) => {
      try {
        const messageData = JSON.parse(messageEvent.data);
        this.routeMessage(messageData);
      } catch (e) {
        console.error('Error parsing message: ', messageEvent.data)
      }
    });

    this.eventCallbacks = new Map<string, (() => void)[]>();

    // TODO: remove when registration is done
    this.socket.addEventListener('open', () => {
      this.register('yury');
    });
  }

  private handleUserInfo = (data: SocketMessageUserInfoPayload) => {
    const { user } = data;
    console.log('Current user: ', user);
    this.currentUser = user;
  }

  private handleUsersList = (data: SocketMessageUsersListPayload) => {
    this.users = data.users;
  }

  private handleMessage = (data: SocketMessageMessagePayload) => {
    this.messages.push(data as Message);
  }

  private handleError = (data: SocketMessageErrorPayload) => {
    console.error(data);
  }

  private routeMessage = (message: SocketMessage) => {
    console.log('Message in router: ', message);
    const { type, data } = message;
    switch (type) {
      case MESSAGE_TYPES.USER_INFO:
        this.handleUserInfo(data as SocketMessageUserInfoPayload);
        break;
      case MESSAGE_TYPES.USERS_LIST:
        this.handleUsersList(data as SocketMessageUsersListPayload);
        break;
      case MESSAGE_TYPES.MESSAGE:
        this.handleMessage(data as SocketMessageMessagePayload);
        break;
      case MESSAGE_TYPES.ERROR:
      default:
        this.handleError(data as SocketMessageErrorPayload);
        break;
    };

    if (this.eventCallbacks.has(message.type)) {
      this.eventCallbacks.get(message.type)?.forEach((cb) => cb());
    }
  }
}

