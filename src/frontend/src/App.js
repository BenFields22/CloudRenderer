import React from "react";
import Home from "./Home";
import './App.css';
import { Authenticator} from "aws-amplify-react";
import Amplify from 'aws-amplify';
import '@aws-amplify/ui/dist/style.css';

Amplify.configure({
  Auth: {
    identityPoolId: process.env.REACT_APP_ID_POOL,
    region: 'us-west-2',
    userPoolId: process.env.REACT_APP_USER_POOL,
    userPoolWebClientId: process.env.REACT_APP_WEB_CLIENT_ID,
  },
    Storage: {
        AWSS3: {
            bucket: 'raytracerompletejobs', //REQUIRED -  Amazon S3 bucket name
            region: 'us-west-2', //OPTIONAL -  Amazon service region
        }
    }
});

class App extends React.Component {
  render() {
    return (
      <div>
        <Authenticator>
          <Home />
        </Authenticator>
      </div>
    );
  }
}

export default App;