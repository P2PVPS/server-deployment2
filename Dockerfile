# Creates a Ubuntu container for running the p2pvps-server2.
# user/password: p2pvps/password

#INSTRUCTIONS
# Build and launch P2P VPS server by executing the docker-compose file with the
# following command:
# docker-compose up -d


#IMAGE BUILD COMMANDS
FROM ubuntu:16.04
MAINTAINER Chris Troutner <chris.troutner@gmail.com>

#Update the OS and install any OS packages needed.
RUN apt-get update
RUN apt-get install -y sudo

#Create the user 'connextcms' and add them to the sudo group.
RUN useradd -ms /bin/bash p2pvps
RUN adduser p2pvps sudo

#Set password to 'password' change value below if you want a different password
RUN echo p2pvps:password | chpasswd

#Set the working directory to be the connextcms home directory
WORKDIR /home/p2pvps

#Install KeystoneJS Dependencies
RUN apt-get update
RUN apt-get install -y git
RUN apt-get install -y curl
RUN apt-get install -y nano
#RUN apt-get install -y make
#RUN apt-get install -y g++
#RUN apt-get install -y python

#Fixes kerberos issue
#RUN apt-get install -y libkrb5-dev

#Install Node and NPM
RUN curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs
RUN apt-get install -y build-essential
#RUN npm install -g npm

#Give node.js permission to run on port 80
RUN apt-get install -y libcap2-bin
#RUN setcap cap_net_bind_service=+ep /usr/bin/nodejs

#Comment this instruction out if it causes errors.
#RUN sudo npm install -g node-inspector

#Create a volume for persisting MongoDB data.
#VOLUME /data/db

#Create a directory for customizing the new site.
#VOLUME /home/connextcms/theme
#VOLUME /home/connextcms/plugins
#VOLUME /home/connextcms/public
VOLUME /home/p2pvps/logs

#Log into the shell as the newly created user
USER p2pvps

#Clone the keystone files.
#RUN git clone https://github.com/christroutner/keystone4-compiled
#RUN mv keystone4-compiled keystone4

#Clone ConnextCMS
#RUN git clone https://github.com/christroutner/ConnextCMS
#RUN mv ConnextCMS connextCMS


#Clone plugins
#RUN git clone https://github.com/skagitpublishing/plugin-template-connextcms


#COPY finalsetup finalsetup
#COPY keystone.js keystone.js
#COPY mergeandlaunch mergeandlaunch
#COPY dummyapp.js dummyapp.js
RUN echo 'password' | sudo -S pwd
#RUN sudo chmod 775 finalsetup
#RUN sudo chmod 775 mergeandlaunch

#Bash script file to run final changes to the environment.
#RUN ./finalsetup

#Use port 80 if you don't plan to use nginx and have only one installation.
#EXPOSE 80

#Use port 3000 or above if you plan to use nginx as a proxy and/or have multiple installations on the same server.
EXPOSE 5000

#Node-Inspector debug port
EXPOSE 9229
EXPOSE 9222

#Dummy app just to get the container running with docker-compose.
#You can then enter the container with command: docker exec -it <container ID> /bin/bash
WORKDIR /home/p2pvps
#RUN npm install express
#RUN npm install dotenv
#RUN npm install keystone
#RUN npm install express-handlebars
#RUN npm install underscore
#RUN npm install request
#RUN npm install request-promise

# Clone the p2pvps-server2 repo
RUN git clone https://github.com/P2PVPS/p2pvps-server2
WORKDIR /home/p2pvps/p2pvps-server2
RUN npm install

#WORKDIR /home/connextcms/
#RUN ./mergeandlaunch
#WORKDIR /home/connextcms/myCMS
#CMD ["node", "dummyapp.js"]
CMD ["npm", "start"]


#change directory where the mergeandlaunch script is located.
#WORKDIR /home/connextcms

#Run the mergeandlaunch script before starting Keystone with node.
#ENTRYPOINT ["./mergeandlaunch", "node", "keystone.js"]
