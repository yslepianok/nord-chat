What needs to be done:

1. + Dig into API, tune the sam package
2. + Add UI that will work with plain websockets
3. Github actions setup
3.1. sam build and sam deploy package
3.2. build and deploy for UI app
4. Extend app to have history
5. Add user registration and authorization flow (with password and tokens and probably aws cognito)
6. Extend app to have 'user is writing' feature (?)
7. Add development + production CI environments


API:
1. Create a common socket-sender service and save in a shared(between other lambdas) level
2. + register should be the normal lambda api
3. 

4. In future - add active/inactive users logic

CI/Infr:
1. Move functions timeout to parameter
2. Current CI/CD pipeline requires us to manually add socket api endpoint to CI config - and it's a problem, because we don't know this api on the stage of initial deployment. Best of all is to take it from previous step OR from environment (like now)
