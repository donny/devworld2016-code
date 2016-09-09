#!/bin/bash

SOURCE='--source-url https://source.developers.google.com/p/1470605832278/r/default --source /ocr --source-branch master'

gcloud alpha functions deploy ocr-extract $SOURCE --trigger-gs-uri dev-world-image-bucket --entry-point processImage
gcloud alpha functions deploy ocr-translate $SOURCE --trigger-topic dev-world-translate-topic --entry-point translateText
gcloud alpha functions deploy ocr-save $SOURCE --trigger-topic dev-world-result-topic --entry-point saveResult
