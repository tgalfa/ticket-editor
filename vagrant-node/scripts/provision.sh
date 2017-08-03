#!/bin/bash

sudo echo "Europe/Berlin" | sudo tee /etc/timezone
sudo dpkg-reconfigure -f noninteractive tzdata

sudo apt-get update -y
sudo apt-get install -y build-essential curl git libssl-dev man mongodb-clients

git clone https://github.com/creationix/nvm.git ~/.nvm && cd ~/.nvm && git checkout `git describe --abbrev=0 --tags`
echo "source ~/.nvm/nvm.sh" >> ~/.profile
source ~/.profile

echo "******************"
echo "Install gsfonts..."
echo "******************"
echo ""
echo ""
sudo apt-get install gsfonts


echo "****************"
echo "Install Node...."
echo "****************"
echo ""
echo ""
nvm install v4
nvm use v4

npm install -g node-pre-gyp 
npm install -g browserify
npm install -g eslint
npm install -g find-versions
npm install -g forany
npm install -g grunt-cli
npm install -g harp
npm install -g http-server
npm install -g knockat
npm install -g less
npm install -g mocha
npm install -g pm2
#npm install -g pm2-web
npm install -g reqd
npm install -g uglify-js

echo "cd ~/projects" >> ~/.profile

echo "****************"
echo "Install Cairo..."
echo "****************"
echo ""
echo ""
sudo apt-get update 
sudo apt-get install libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++

echo "***********************************"
echo "Run npm install and then run app..."
echo "***********************************"
cd ~/projects/ticket-editor
echo "Execute these commands from the /ticket-editor folder:..."
echo "# The --no-bin-links argument will prevent npm from creating symlinks for any binaries the package might contain." 
echo "Use --no-bin-links only if you run virtual machine on windows host."
echo "npm install --no-bin-links"
echo ""
echo "# if npm install returns with an error during canvas modul install (gyp ERR! stack Error: `gyp` failed with exit code: 1) run:"
echo "npm install -g node-pre-gyp"
echo ""
echo "# if you installed node-canvas after installing Pango, reinstall node-canvas"
echo "rm -r node_modules/canvas && npm install canvas"
echo ""
echo "# run the app"
echo "npm run start"
echo "***********************************"
echo ""
echo ""

#npm install --no-bin-links

# if you installed node-canvas after installing Pango, reinstall node-canvas
#rm -r node_modules/canvas && npm install canvas

# run the app
#npm run start

ssh-keyscan github.com >> ~/.ssh/known_hosts

echo "Everything done, have a nice day :-)!"
