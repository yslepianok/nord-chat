export REACT_APP_SOCKET_API_URL=$1
rm output.yml
rm -rf build
npm ci
npm run build
aws cloudformation package --template-file ./template.yml --output-template-file output.yml --s3-bucket=nord-chat-resources
aws cloudformation deploy --template-file output.yml --stack-name nord-chat-ui --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
aws cloudformation describe-stacks --stack-name  nord-chat-ui --query Stacks[].Outputs[].OutputValue --output text