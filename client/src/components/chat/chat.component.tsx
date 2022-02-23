import { Container, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import { ChatInput } from "./chat-input.component";
import { ChatSocketService } from '../../services/chat.service';

import { useEffect, useState } from "react";
import { Message, MESSAGE_TYPES, User } from "../../types";

export function Chat() {
  const [messages, updateMessages] = useState<Message[]>([]);
  const [currentUser, updateCurrentUser] = useState<User | null>(null);

  const chatSocketService = ChatSocketService.getInstance();

  const refreshMessages = (): void => {
    updateMessages([...chatSocketService.messages]);
  }

  const refreshUser = (): void => {
    updateCurrentUser(chatSocketService.currentUser);
  }

  useEffect(() => {
    chatSocketService.subscribeUpdates(MESSAGE_TYPES.MESSAGE, refreshMessages);
    chatSocketService.subscribeUpdates(MESSAGE_TYPES.USER_INFO, refreshUser);
    refreshMessages();
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container>
      <Row>
        <ListGroup className="min-height">
          {
            messages.map(({ messageText, user }, index) => {
              const isOwnMessage = user?.id === currentUser?.id;
              return (
                <ListGroupItem
                  key={index}
                  className={isOwnMessage ? 'align-self-end' : 'align-self-start'}
                >
                  {user?.username || 'anonymous'}: {messageText}
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