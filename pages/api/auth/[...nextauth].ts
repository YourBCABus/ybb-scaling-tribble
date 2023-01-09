import NextAuth, { NextAuthOptions } from "next-auth";
import { Provider as OAuthProvider } from "next-auth/providers";
import { JWT } from "next-auth/JWT/types";
import { NextApiRequest, NextApiResponse } from "next";

const getEnv = (varName: string) => <T extends [string] | []>(...defaultVal: T): string | T[0] => process.env[varName] ?? defaultVal[0];

const ybbApiUrl = getEnv("YBB_API_URL")("https://api.yourbcabus.com");
const getYbbClientId = getEnv("YBB_CLIENT_ID");
const getYbbClientSecret = getEnv("YBB_CLIENT_SECRET");


const canRefresh = (token: JWT): token is JWT & { refreshToken: string } => {
    if (typeof token.refreshToken !== 'string') return false;
    if (!token.accessToken) return true;
    if (typeof token.accessTokenExpires === "number") { 
        if (Date.now() >= token.accessTokenExpires) return true;
    }
    return false;
};

async function refreshAccessToken(token: string) {
    const response = await fetch(`${ybbApiUrl}/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: getYbbClientId(""),
            client_secret: getYbbClientSecret(""),
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







export default async function auth(req: NextApiRequest, res: NextApiResponse) {
    const ybbProvider: OAuthProvider = {
        // Common provider config:
        id: "yourbcabus",
        name: "YourBCABus",
        type: "oauth",
        version: "2.0",

        wellKnown: `${ybbApiUrl}/.well-known/openid-configuration`,

        // Client credentials:
        clientId: getYbbClientId(),
        clientSecret: getYbbClientSecret(),

        // // Auth URLS
        // // authorization: `${ybbApiUrl}/authorize?response_type=code&prompt=consent`,
        // authorization: {
        //     params: {
        //         response_type: "code",
        //         prompt: "consent",
        //     },
        //     // url: `${ybbApiUrl}/authorize`,
        // },

        // // Token stuff
        // idToken: true,
        // issuer: "https://api.yourbcabus.com",

        // // requestTokenUrl: `${ybbApiUrl}/token`,
        // // accessTokenUrl: `${ybbApiUrl}/token`,
        // token: {
        //     // url: `${ybbApiUrl}/token`,
        //     params: {
        //         scope: "openid email offline_access read bus.create bus.update bus.updateStatus bus.delete stop.create stop.update stop.delete",
        //         grant_type: "authorization_code",
        //         protection: "both",
        //     },
        // },

        // Profile URL
        // profileUrl: `${ybbApiUrl}/me`,
        profile(profile) {
            return {
                id: profile.sub ?? "invalid",
                name: profile.name,
                email: profile.email,
                image: profile.image,
            };
        },

        // scope: "openid email offline_access read bus.create bus.update bus.updateStatus bus.delete stop.create stop.update stop.delete",
        // params: { grant_type: "authorization_code" },
        // protection: "both",
    };
    const options: NextAuthOptions = {
        // secret: "bloop",
        providers: [ybbProvider],

        callbacks: {
            
            async jwt({ token, user, account }) {
                // if (account && user) {
                //     token.accessToken = account.access_token;
                //     token.accessTokenExpires = account.expires_at ?? 0;
                //     token.refreshToken = account.refresh_token;
                // } else if (canRefresh(token)) {
                //     // Refresh the access token.
                //     try {
                //         const { accessToken, accessTokenExpires, refreshToken } = await refreshAccessToken(token.refreshToken);
                //         token.accessToken = accessToken;
                //         token.accessTokenExpires = accessTokenExpires;
                //         token.refreshToken = refreshToken;
                //     } catch (e) {
                //         token.error = "RefreshAccessTokenError";
                //     }
                // }
                return token;
            },
            async session({ session, token }) {
                // const expiry = typeof token.accessTokenExpires === "string" ? new Date(token.accessTokenExpires).toISOString() : "0";
                // session.expires ??= expiry;
    
                // session.accessToken = token.accessToken ? token.accessToken.toString() : "";
                return session;
            },
        },
        // session: {
        //     strategy: "jwt",
        // },
        debug: process.env.NODE_ENV !== 'production',
    };

    // Do whatever you want here, before the request is passed down to `NextAuth`
    return await NextAuth(req, res, options);
}
