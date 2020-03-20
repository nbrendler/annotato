import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloProvider
} from "@apollo/client";
import { setContext } from "apollo-link-context";
import "highlightjs/styles/monokai-sublime";

import "./style";
import App from "./components/app";

const GITHUB_API = `https://api.github.com/graphql`;

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = localStorage.getItem("token");

  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ""
    }
  };
});

const httpLink = new HttpLink({ uri: GITHUB_API });

const cacheFn = o => {
  if (["TreeEntry", "Tree", "Blob"].indexOf(o.__typename) > -1) {
    return `${o.oid}_${o.__typename}`;
  }
  if (o.__typename === "Repository") {
    return o.id;
  }
};

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    dataIdFromObject: cacheFn
  })
});

// eslint-disable-next-line react/display-name
export default () => (
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
