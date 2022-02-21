What needs to be done:

1. Dig into API, tune the sam package
2. Add UI that will work with plain websockets
3. Github actions setup
3.1. sam build and sam deploy package
3.2. build and deploy for UI app
4. Extend app to have history
5. Add user registration and authorization flow (with password and tokens and probably aws cognito)
6. Extend app to have 'user is writing' feature (?)
7. Add development + production CI environments


API:
1. rework api to have both sockets and normal lambdas
2. register should be the normal lambda api
3. cloudfront distribution should have URL that will lead to API gateway

4. In future - add active/inactive users logic

CI/Infr:
1. Move functions timeout to parameter
