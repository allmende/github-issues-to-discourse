# Installation

## Install Node/NPM
```
wget https://nodejs.org/dist/v4.4.4/node-v4.4.4-linux-x64.tar.xz
mkdir node
tar xvf node-v4.4.4-linux-x64.tar.xz --strip-components=1 -C ./node
mkdir node/etc
echo 'prefix=/usr/local' > node/etc/npmrc
sudo mv node /opt/
sudo chown -R root: /opt/node
sudo ln -s /opt/node/bin/node /usr/local/bin/node
sudo ln -s /opt/node/bin/npm /usr/local/bin/npm
```

## Install Application
Be sure to reference your HTTPS key and cert in the config if using HTTPS  
Setup a GitHub OAuth Developer Application (Profile > Settings at GitHub)
* Put in your application name, URL, description
* Callback field should be your `https://example.com/auth/github/callback` (replace example.com with your URL)
* Copy the Client ID and Key into the appropriate config locations
```
git clone https://github.com/cpradio/github-issues-to-discourse.git
cd github-issues-to-discourse
cp config/index.js.sample config/index.js
nano config/index.js
npm install
```

## Install PM2
Replace `bin/www` with `bin/https` if using HTTPS
```
sudo npm install pm2 -g
sudo setcap cap_net_bind_service=+ep /opt/node/bin/node
env CONFIG=production pm2 start bin/www
pm2 save
pm2 startup ubuntu
```

## Updating the Application
Pull down the latest source from github, update the packages, restart the app
```
git pull
npm install
pm2 restart 0
```

Source: https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04
