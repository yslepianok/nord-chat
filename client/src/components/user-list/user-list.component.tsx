import { ListGroup, ListGroupItem } from "react-bootstrap";
import { ChatSocketService } from '../../services/chat.service';
import { useEffect, useState } from "react";
import { MESSAGE_TYPES, User } from "../../types";

export function UserList() {
  const chatSocketService = ChatSocketService.getInstance();
  const [users, updateUsers] = useState<User[]>(Array.from(chatSocketService.users.values()));
  const [currentUser, updateCurrentUser] = useState(chatSocketService.currentUser);

  const refreshUsers = (): void => {
    updateUsers(Array.from(chatSocketService.users.values()));
  };

  const refreshCurrentUser = (): void => {
    updateCurrentUser(chatSocketService.currentUser);
  };

  useEffect(() => {
    chatSocketService.subscribeUpdates(MESSAGE_TYPES.USER_REGISTERED, refreshUsers);
    chatSocketService.subscribeUpdates(MESSAGE_TYPES.USER_INFO, refreshCurrentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(users);

  return (
    <ListGroup>
      {
        users.map((user: User, index) => {
          const { id, username } = user;

          return <ListGroupItem key={index}>
            {
              id === currentUser?.id
                ? `${username} (you)`
                : username
            }
          </ListGroupItem>
        })
      }
    </ListGroup>
  )
}