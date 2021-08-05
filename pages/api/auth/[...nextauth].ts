import NextAuth from "next-auth";

const url = "https://api.yourbcabus.com";

export default NextAuth({
    providers: [
        {
            id: "yourbcabus",
            name: "YourBCABus",
            type: "oauth",
            version: "2.0",
            scope: "profile openid email offline_access",
            params: { grant_type: "authorization_code" },
            accessTokenUrl: `${url}/token`,
            requestTokenUrl: `${url}/token`,
            authorizationUrl: `${url}/authorize?response_type=code`,
            profileUrl: `${url}/me`,
            profile(profile) {
                return {
                    id: profile.sub!,
                };
            },
            clientId: process.env.YBB_CLIENT_ID || "changeme",
            clientSecret: process.env.YBB_CLIENT_SECRET || "",
            protection: "both",
        },
    ],
    callbacks: {
        async jwt(token, user, account, profile) {
            // TODO: Properly handle refresh tokens
            if (account) {
                token.accessToken = account.accessToken;
                token.refreshToken = account.refreshToken;
            }
            return token;
        },
        async session(session, token) {
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.sub = token.sub;
            return session;
        },
    },
});
