echo "Preparing code artifact for deployment to AWS Lambda by running NPM build script"
npm run build

echo "Using 'personal' AWS profile."
export AWS_PROFILE=personal

echo "Deploying to AWS Lambda."
aws lambda update-function-code --function-name digitalDetox \
--zip-file fileb://dist/index.zip \
--region=ap-southeast-1
