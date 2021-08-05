import { ApolloClient, InMemoryCache } from "@apollo/client";

// Defining it this way lets VS Code auto-import client
export const client = new ApolloClient({
    uri: "http://localhost:3000/graphql",
    cache: new InMemoryCache(),
});

export default client;
