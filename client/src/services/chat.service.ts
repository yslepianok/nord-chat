import {
  Message,
  MESSAGE_TYPES,
  SocketMessage,
  SocketMessageErrorPayload,
  SocketMessageMessagePayload,
  SocketMessageUserInfoPayload,
  SocketMessageUsersListPayload,
  User,
} from "../types";

const SOCKET_ROUTES = {
  REGISTER: 'register',
  SEND_MESSAGE: 'sendmessage',
}
export class ChatSocketService {
  private static instance: ChatSocketService;

  private socket: WebSocket;
  private eventCallbacks = new Map<string, (() => void)[]>();

  public messages: Message[] = [];
  public users: User[] = [];
  public currentUser: User | null = null;

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
      const randomId = Math.ceil(Math.random() * 1000);
      this.register(`user-${randomId}`);
    });
  }

  private handleUserInfo = (data: SocketMessageUserInfoPayload) => {
    const { user } = data;
    this.currentUser = user;
  }

  private handleUsersList = (data: SocketMessageUsersListPayload) => {
    this.users = data.users;
  }

  private handleUserRegistered = (data: SocketMessageUserInfoPayload) => {
    const { user } = data;
    this.users.push(user);
  }

  private handleMessage = (data: SocketMessageMessagePayload) => {
    const { userId, messageText } = data;
    this.messages.push({
      userId,
      messageText,
      arrivedAt: new Date(),
    });
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
      case MESSAGE_TYPES.USER_REGISTERED:
        this.handleUserRegistered(data as SocketMessageUserInfoPayload);
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

