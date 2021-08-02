module.exports = {
    client: {
        service: {
            name: "yourbcabus",
            localSchemaFile: "./graphql-schema.json",
        },
        includes: ["pages/**/*.js", "pages/**/*.ts", "pages/**/*.jsx", "pages/**/*.tsx", "lib/**/*.js", "lib/**/*.ts", "lib/**/*.jsx", "lib/**/*.tsx"],
        tagName: "gql",
    },
};
