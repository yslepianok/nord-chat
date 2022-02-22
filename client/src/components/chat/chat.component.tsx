import { Container, ListGroup, Row } from "react-bootstrap";
import { ChatInput } from "./chat-input.component";
import { ChatSocketService, Message, MESSAGE_TYPES } from '../../services/chat.service';

import { useEffect, useState } from "react";
import { ListGroupItem } from "react-bootstrap";

export function Chat() {
  const chatSocketService = ChatSocketService.getInstance();
  const [messages, updateMessages] = useState([...chatSocketService.messages]);

  const refreshMessages = (): void => {
    updateMessages([...chatSocketService.messages]);
  }

  useEffect(() => {
    chatSocketService.subscribeUpdates(MESSAGE_TYPES.MESSAGE, refreshMessages);
  }, []);

  return (
    <Container>
      <Row>
        <ListGroup>
          {
            messages.map((message: Message, index) => {
              return (
                <ListGroupItem key={index}>{message.messageText}</ListGroupItem>
              );
            })
          }
        </ListGroup>
      </Row>
      <Row>
        <ChatInput/>
      </Row>
    </Container>
  );
}