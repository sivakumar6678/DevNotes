#!/bin/bash
cd /home/sivakumar/Documents/Projects/DevNotes/frontend
node node_modules/typescript/lib/tsc.js -p tsconfig.app.json --noEmit 2>&1
echo "EXIT_CODE:$?"
