// export const environment = {
//     ApiUrl: "https://localhost:5001",
//     graphql: "https://localhost:5001/graphql"
// };
export const environment = {
  production: true,
  ApiUrl: '/api',   // <- relative, goes through Nginx
  graphql: '/api/graphql'   // <- relative, goes through Nginx
};
