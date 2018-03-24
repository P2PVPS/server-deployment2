# Nginx
This readme contains instructions for setting up Nginx to serve static files and proxy to ConnextCMS. Nginx is more 
efficient at serving static files than Node/Express/KeystoneJS, and it is easier to
configure for various optimizations like browser caching and compression. It's also needed to incorporate
an SSL certificate. This readme also contains instructions for registering your domain with Let's Encrypt to 
obtain an SSL certificate.

This configuration described here opts to run nginx on the host system, as opposed to running it in a separate Docker container.
This makes it easier to preserve encryption keys, and auto-renew the SSL certificate. Multiple installations of
ConnextCMS can be run on the same machine. A single installation of nginx is easier to configure for proxying
traffic to multiple applications.

Here is an illustration of the containerization scheme used. The Compose file spins up MongoDB and ConnextCMS in their
own containers. Nginx executes in the host system and redirects traffic from port 80 to port 3000, which is the
port connected to the ConnextCMS container. Nginx also handles encryption of https traffic.

![nginx docker diagram](images/container-diagram.jpg?raw=true "nginx docker diagram")


## Setup Nginx
It's assumed that you are starting with a fresh installation of Ubuntu 16.04 LTS on a 64-bit machine. 
It's also assumed that you are installing as a [non-root user with sudo privileges](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-16-04). 

1. Set up your site as a regular ConnextCMS installation. You should also have a registered domain names and functional
DNS configuration so that the domain resolves to your ConnextCMS installation on port 3000, or any port other than 80.
The steps below will configure Nginx to serve your website on port 80, but assumes your application is running on port 3000.

2. Install Nginx:
```
sudo apt-get update
sudo apt-get install nginx
```

3. Backup the nginx default file and create a new one with nano:

`cd /etc/nginx/sites-available`

`sudo mv default bkup-default`

`sudo nano default`

3. Paste the following into it. Replace **example.com** with your domain and change the `root` directive to 
point to your cloned copy of this repository:
```
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  #listen 443 ssl http2 default_server;
  #listen [::]:443 ssl http2 default_server;

  #Edit as appropriate to point to the public file directory.
  root /home/trout/docker-connextcms/public;

  server_name example.com www.example.com;
  #include snippets/ssl-newserver.example.com.conf;
  #include snippets/ssl-params.conf;

  client_max_body_size 50M; #allow file uploads up to 50 MB

  #Turn on gzip compression
  gzip on;
  gzip_disable "msie6";
  gzip_comp_level 6;
  gzip_min_length 1100;
  gzip_buffers 16 8k;
  gzip_proxied any;
  gzip_types
      text/plain
      text/css
      text/js
      text/xml
      text/javascript
      application/javascript
      application/x-javascript
      application/json
      application/xml
      application/rss+xml
      image/svg+xml;

  
  #This block prevents browser caching of anything in the /keystone URI.
  #Browser caching will break the ability to log into KeystoneJS.
  location ^~ /keystone {   
    try_files $uri @backend2;
  }
  location @backend2 {
    proxy_pass http://127.0.0.1:3000;
    access_log off;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;

  }
  
  #This block turns on browser caching of static assets and proxys
  #the connection to the node application running on port 3000.
  location / {
    # First attempt to serve request as file, then
    # as directory, then fall back to displaying a 404.
    #proxy_pass http://127.0.0.1:3000;
    #try_files $uri $uri/ =404;

    #http://ksloan.net/configuring-nginx-for-node-js-web-apps-that-serve-both-static-and-dynamic-content/
    try_files $uri @backend1;    
  }
  location @backend1 {
    proxy_pass http://127.0.0.1:3000;
    access_log off;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;

  }

  #Browser caching
  location ~*  \.(jpg|jpeg|png|gif|ico|css|js|otf|ttf|woff2)$ {
    expires 7d;
  }
  location ~*  \.(pdf)$ {
    expires 7d;
  }

}
```

4. Check that there are no syntax errors in the config file:

`sudo nginx -t`

5. Restart nginx:

`sudo systemctl restart nginx`

Nginx should now proxy ConnextCMS running on port 3000 in the Docker container to port 80 on the host system.


## Setup SSL Certificate
Now that your domain is up and running on port 80 at *example*.com, you can apply for an SSL certificate from Let's Encrypt.
Here are the steps needed to get the SSL certificate and install it.

1. Install the Let's Encrypte Certbot:
```
sudo apt-get update
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
sudo apt-get install python-certbot-nginx 
```

2. Obtain a certificate for your domain. Examples below will use **example.com** as the domain. Be sure to
change the directory path to the `public` directory containing static assets for your installation.

`sudo certbot certonly --webroot -w /home/username/docker-connextcms/public -d example.com -d www.example.com`

If successful, you'll be presented with 'Congradulations!' message. This message will contain the directory path
to your certificate. **Take not of this directory path** as you'll use it in step 6. It will look like
`/etc/letsencrypt/live/example.com/fullchain.pem`.

3. Generate a strong DH group for a private key:

`sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048`

This will create a private key file at `/etc/ssl/certs/dhparam.pem`

4. Create the file `sudo nano /etc/nginx/snippets/ssl-example.com.conf` and add these lines to the file:
```
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
```

5. Create the file `sudo nano /etc/nginx/snippets/ssl-params.conf` and add these lines to the file:
```
# from https://cipherli.st/
# and https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html

ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_prefer_server_ciphers on;
ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
ssl_ecdh_curve secp384r1;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
# Disable preloading HSTS for now.  You can use the commented out header line that includes
# the "preload" directive if you understand the implications.
#add_header Strict-Transport-Security "max-age=63072000; includeSubdomains; preload";
add_header Strict-Transport-Security "max-age=63072000; includeSubdomains";
add_header X-Content-Type-Options nosniff;
		
ssl_dhparam /etc/ssl/certs/dhparam.pem;
```

6. Backup the current nginx file:
```
cd /etc/nginx/sites-available
sudo cp default bkup-default
```

7. Remove the nginx default file and create a new one with nano:

`sudo rm default`

`sudo nano default`

8. Paste the following into it. Replace **example.com** with your domain and change the `root` directive to 
point to your cloned copy of this repository. This is the same config file as above, but with the SSL stuff uncommented.
```
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  listen 443 ssl http2 default_server;
  listen [::]:443 ssl http2 default_server;

  #Edit as appropriate to point to the public file directory.
  root /home/trout/docker-connextcms/public;

  server_name example.com www.example.com;
  include snippets/ssl-example.com.conf;
  include snippets/ssl-params.conf;

  client_max_body_size 50M; #allow file uploads up to 50 MB

  #Turn on gzip compression
  gzip on;
  gzip_disable "msie6";
  gzip_comp_level 6;
  gzip_min_length 1100;
  gzip_buffers 16 8k;
  gzip_proxied any;
  gzip_types
      text/plain
      text/css
      text/js
      text/xml
      text/javascript
      application/javascript
      application/x-javascript
      application/json
      application/xml
      application/rss+xml
      image/svg+xml;

  
  #This block prevents browser caching of anything in the /keystone URI.
  #Browser caching will brake the ability to log into KeystoneJS.
  location ^~ /keystone {   
    try_files $uri @backend2;
  }
  location @backend2 {
    proxy_pass http://127.0.0.1:3000;
    access_log off;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;

  }
  
  #This block turns on browser caching of static assets and proxys
  #the connection to the node application running on port 3000.
  location / {
    # First attempt to serve request as file, then
    # as directory, then fall back to displaying a 404.
    #proxy_pass http://127.0.0.1:3000;
    #try_files $uri $uri/ =404;

    #http://ksloan.net/configuring-nginx-for-node-js-web-apps-that-serve-both-static-and-dynamic-content/
    try_files $uri @backend1;    
  }
  location @backend1 {
    proxy_pass http://127.0.0.1:3000;
    access_log off;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;

  }

  #Browser caching
  location ~*  \.(jpg|jpeg|png|gif|ico|css|js|otf|ttf|woff2)$ {
    expires 7d;
  }
  location ~*  \.(pdf)$ {
    expires 7d;
  }

}

```

11. Check that there are no syntax errors in the config file:

`sudo nginx -t`

12. Restart nginx:

`sudo systemctl restart nginx`

