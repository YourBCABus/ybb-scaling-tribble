import NextAuth, { Session } from "next-auth";

const url = "https://api.yourbcabus.com";

async function refreshAccessToken(token: string) {
    const response = await fetch(`${url}/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: process.env.YBB_CLIENT_ID || "changeme",
            client_secret: process.env.YBB_CLIENT_SECRET || "",
            grant_type: "refresh_token",
            refresh_token: token,
        }).toString(),
    });
    const result = await response.json();
    if (!result) {
        throw result;
    }
    return {
        accessToken: result.access_token,
        accessTokenExpires: Date.now() + result.expires_in * 1000,
        refreshToken: result.refresh_token ?? token,
    };
}

export default NextAuth({
    providers: [
        {
            id: "yourbcabus",
            name: "YourBCABus",
            type: "oauth",
            version: "2.0",
            scope: "openid email offline_access read bus.create bus.update bus.updateStatus bus.delete stop.create stop.update stop.delete",
            params: { grant_type: "authorization_code" },
            accessTokenUrl: `${url}/token`,
            requestTokenUrl: `${url}/token`,
            authorizationUrl: `${url}/authorize?response_type=code&prompt=consent`,
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
        async jwt(token, user, account) {
            if (account && user) {
                token.accessToken = account.accessToken;
                token.accessTokenExpires = Date.now() + account.expires_in! * 1000;
                token.refreshToken = account.refreshToken;
            } else if (typeof token.refreshToken === "string" && (!token.accessToken || (typeof token.accessTokenExpires === "number" && Date.now() >= token.accessTokenExpires))) {
                // Refresh the access token.
                try {
                    const { accessToken, accessTokenExpires, refreshToken } = await refreshAccessToken(token.refreshToken);
                    token.accessToken = accessToken;
                    token.accessTokenExpires = accessTokenExpires;
                    token.refreshToken = refreshToken;
                } catch (e) {
                    token.error = "RefreshAccessTokenError";
                }
            }
            return token;
        },
        async session(session: Session, token) {
            session.accessToken = token.accessToken as string;
            session.sub = token.sub;
            return session;
        },
    },
});
