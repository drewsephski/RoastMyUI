#!/bin/bash

# Name of the output zip file
OUTPUT_FILE="roast-my-ui-extension.zip"

# Directory containing the extension files
EXTENSION_DIR="chrome-extension"

# Remove existing zip file if it exists
if [ -f "$OUTPUT_FILE" ]; then
  rm "$OUTPUT_FILE"
fi

# Create the zip file
echo "Creating $OUTPUT_FILE..."
zip -r "$OUTPUT_FILE" "$EXTENSION_DIR" -x "*.DS_Store"

echo "Done! Upload $OUTPUT_FILE to the Chrome Web Store."
