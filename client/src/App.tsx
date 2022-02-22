import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';


import { Col, Container, Row } from 'react-bootstrap';
import { UserList } from './components/user-list/user-list.component';
import { Chat } from './components/chat/chat.component';

function App() {
  return (
    <div className="App mt-50">
      <Container>
        <Row>
          <Col xs={3}>
            <UserList />
          </Col>
          <Col xs={9}>
            <Chat/>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
