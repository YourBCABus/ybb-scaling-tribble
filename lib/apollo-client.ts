import { ApolloClient, InMemoryCache } from "@apollo/client";

// Defining it this way lets VS Code auto-import client
export const client = new ApolloClient({
    uri: "https://api.yourbcabus.com/graphql",
    cache: new InMemoryCache(),
});

export default client;
