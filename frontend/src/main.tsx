import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Auth0Provider } from "@auth0/auth0-react";

const domain = "dev-ff8emtmqr8m22cau.us.auth0.com";     // e.g. dev-xyz.us.auth0.com
const clientId = "2hSQWHW6Sm72Fh7pg19tY9a9d0ru19qD";       // e.g. 7qAbc...

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);