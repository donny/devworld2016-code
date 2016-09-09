#!/bin/bash

gsutil cp ./menu.jpg gs://image-bucket
gsutil cp gs://text-bucket/menu_to_en.txt .
