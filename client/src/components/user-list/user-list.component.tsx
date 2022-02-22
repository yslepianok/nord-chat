import { Container, ListGroup, ListGroupItem, Row } from "react-bootstrap";
import { ChatSocketService } from '../../services/chat.service';
import { useEffect, useState } from "react";
import { MESSAGE_TYPES, User } from "../../types";

export function UserList() {
  const chatSocketService = ChatSocketService.getInstance();
  const [users, updateUsers] = useState([...chatSocketService.users]);
  const [currentUser, updateCurrentUser] = useState(chatSocketService.currentUser);

  const refreshUsers = (): void => {
    updateUsers([...chatSocketService.users]);
  };

  const refreshCurrentUser = (): void => {
    updateCurrentUser(chatSocketService.currentUser);
  };

  useEffect(() => {
    chatSocketService.subscribeUpdates(MESSAGE_TYPES.USERS_LIST, refreshUsers);
    chatSocketService.subscribeUpdates(MESSAGE_TYPES.USER_INFO, refreshCurrentUser);
  }, []);

  console.log(users);

  return (
    <Container>
      <ListGroup>
        {
          users.map((user: User, index) => {
            const { userId, username } = user;

            return <ListGroupItem key={index}>
              {
                userId === currentUser?.userId
                  ? `${username} (you)`
                  : username
              }
            </ListGroupItem>
          })
        }
      </ListGroup>
    </Container>
  )
}