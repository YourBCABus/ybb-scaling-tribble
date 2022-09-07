import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { getSession } from "next-auth/client";

const httpLink = createHttpLink({
    uri: 'https://api.yourbcabus.com/graphql',
});

const authLink = setContext(async (_, { headers, req }) => {
    // get the authentication token from local storage if it exists
    const accessToken = (await getSession({req}))?.accessToken;
    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: accessToken ? `Bearer ${accessToken}` : "",
        },
    };
});

export default function createNewClient() {
    return new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
    });
};
