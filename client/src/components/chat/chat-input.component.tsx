import { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { ChatSocketService } from '../../services/chat.service';

const chatSocketService = ChatSocketService.getInstance();

export function ChatInput() {

  const [message, changeMessage] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    await chatSocketService.sendMessage(message);
    changeMessage('');
  };

  const handleChange = (e: any) => {
    changeMessage(e.target.value);
  }

  return (
    <Form onSubmit={handleSubmit}>
      <InputGroup className="offset">
        <Form.Control
          type="text"
          placeholder="Enter message"
          value={message}
          onChange={handleChange}
        />
        <Button variant="outline-secondary" type='submit'>Send</Button>
      </InputGroup>
    </Form>
  );
}