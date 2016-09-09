# Cloud Functions

# Preparation
git config credential.helper gcloud.sh
Show Google Cloud Functions web console

# First example
hcat index.js
# Commit the code and push
git add .
git commit -m 'Push'
# This creates a new function with the name `helloMessageFunction` that uses the code in `helloMessage` module in the `index.js` file in the `/helloMessage` folder. The function can be invoked synchronously via HTTP methods.
gcloud alpha functions deploy helloMessageFunction --source-url https://source.developers.google.com/p/1470605832278/r/default --source /helloMessage --trigger-http --source-branch master --entry-point helloMessage

# Calling the `helloMessageFunction` function
gcloud alpha functions call helloMessageFunction --data '{"name":"Alex"}'
curl -X POST https://us-central1-1470605832278.cloudfunctions.net/helloMessageFunction -H "Content-Type:application/json" --data '{"name":"Steve"}'

# Complex example

# For the next example, let me demo how it works first...

# Open the console and delete all OCR files

# How do we go with time?
# We are going to use Google services to perform optical character recognition
# and text translation
# Get an image of french text

gsutil cp ./file.jpg gs://dev-world-image-bucket
gsutil cp gs://dev-world-text-bucket/file_to_en.txt .

# Show the slides

# Show the code
