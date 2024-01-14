#!/bin/bash

cat << EOF > TheIgloo2.0/TheApp/ios/AppCenter-Config.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "https://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
    <key>AppSecret</key>
    <string>${APP_SECRET}</string>
    </dict>
</plist>
EOF