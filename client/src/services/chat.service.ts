import {
  Message,
  MESSAGE_TYPES,
  SocketMessage,
  SocketMessageErrorPayload,
  SocketMessageMessagePayload,
  SocketMessageUserInfoPayload,
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
  public users = new Map<string, User>();
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

  private handleUserRegistered = (data: SocketMessageUserInfoPayload) => {
    const { user } = data;
    this.users.set(user.id, user);
  }

  private handleMessage = (data: SocketMessageMessagePayload) => {
    const { user, messageText } = data;

    if (!this.users.has(user.id)) {
      console.log('Adding new user to set');
      this.users.set(user.id, user);
      this.notifySubscribers(MESSAGE_TYPES.USER_REGISTERED);
    }
    
    this.messages.push({
      user,
      messageText,
      arrivedAt: new Date(),
    });
  }

  private handleError = (data: SocketMessageErrorPayload) => {
    console.error(data);
  }

  private notifySubscribers = (eventType: string) => {
    if (this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.get(eventType)?.forEach((cb) => cb());
    }
  }

  private routeMessage = (message: SocketMessage) => {
    console.log('Message in router: ', message);
    const { type, data } = message;
    switch (type) {
      case MESSAGE_TYPES.USER_INFO:
        this.handleUserInfo(data as SocketMessageUserInfoPayload);
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

    this.notifySubscribers(type);
  }
}

