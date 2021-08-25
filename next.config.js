module.exports = {
    reactStrictMode: true,
    async redirects() {
        return [
            {
                source: "/",
                destination: "/school/5bca51e785aa2627e14db459",
                permanent: true,
            },
        ];
    },
};
