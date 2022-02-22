import { Container, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import { ChatInput } from "./chat-input.component";
import { ChatSocketService } from '../../services/chat.service';

import { useEffect, useState } from "react";
import { Message, MESSAGE_TYPES } from "../../types";

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