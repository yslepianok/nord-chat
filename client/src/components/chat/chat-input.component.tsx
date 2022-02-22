import { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { ChatSocketService } from '../../services/chat.service';

const chatSocketService = ChatSocketService.getInstance();

export function ChatInput() {

  const [message, changeMessage] = useState('');
  
  const handleSend = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    await chatSocketService.sendMessage(message);
    changeMessage('');
  };

  const handleChange = (e: any) => {
    changeMessage(e.target.value);
  }

  return (
    <InputGroup>
      <Form.Control
        type="text"
        placeholder="Enter message"
        value={message}
        onChange={handleChange}
      />
      <Button variant="outline-secondary" onClick={handleSend}>Send</Button>
    </InputGroup>
  );
}