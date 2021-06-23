import TextEditor from "./TextEditor";
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { v4 as uuidV4 } from 'uuid';

function App() {
  return (
    <BrowserRouter>
      <Switch>

        {/* Redirect user to a new document with random id */}
        <Route path="/" exact><Redirect to={`/documents/${uuidV4()}`} /></Route>

        {/* Display TextEditor component */}
        <Route path="/documents/:id"><TextEditor /></Route>

      </Switch>
    </BrowserRouter>
  );
}

export default App;
