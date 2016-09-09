#!/bin/bash

function_name='devWorldLambda'
region='us-east-1'
zip_file='/Users/kurniawan/unix/tmp/2016/lambda/function.zip'

cd function
find . -type f -exec chmod 0644 {} \;
find . -type d -exec chmod 0755 {} \;
zip -qr ../function.zip *
cd ..

# Update a Lambda function
aws lambda update-function-code \
  --region "$region" \
  --function-name "$function_name" \
  --zip-file fileb://$zip_file

rm $zip_file
