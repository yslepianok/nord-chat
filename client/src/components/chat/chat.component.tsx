import { Container, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import { ChatInput } from "./chat-input.component";
import { ChatSocketService } from '../../services/chat.service';

import { useEffect, useState } from "react";
import { Message, MessageExpanded, MESSAGE_TYPES, User } from "../../types";

export function Chat() {
  const [messagesExpanded, updateMessages] = useState<MessageExpanded[]>([]);
  const [currentUser, updateCurrentUser] = useState<User | null>(null);

  const expandMessages = () => {
    const { users, messages } = chatSocketService;

    const expanded: MessageExpanded[] = messages.map((message: Message) => ({
      message,
      user: users.find((user) => user.id === message.userId)
    }));

    updateMessages(expanded);
  }

  const chatSocketService = ChatSocketService.getInstance();

  const refreshMessages = (): void => {
    expandMessages();
  }

  const refreshUser = (): void => {
    updateCurrentUser(chatSocketService.currentUser);
  }

  useEffect(() => {
    chatSocketService.subscribeUpdates(MESSAGE_TYPES.MESSAGE, refreshMessages);
    chatSocketService.subscribeUpdates(MESSAGE_TYPES.USER_INFO, refreshUser);
    expandMessages();
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container>
      <Row>
        <ListGroup className="min-height">
          {
            messagesExpanded.map(({ message, user }, index) => {
              const isOwnMessage = user?.id === currentUser?.id;
              return (
                <ListGroupItem
                  key={index}
                  className={isOwnMessage ? 'align-self-end' : 'align-self-start'}
                >
                  {user?.username || 'anonymous'}: {message.messageText}
                </ListGroupItem>
              );
            })
          }
        </ListGroup>
      </Row>
      <Row>
        <ChatInput />
      </Row>
    </Container>
  );
}