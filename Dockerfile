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


#Install Node and NPM
RUN curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs
RUN apt-get install -y build-essential
#RUN npm install -g npm

#Give node.js permission to run on port 80
#RUN apt-get install -y libcap2-bin
#RUN setcap cap_net_bind_service=+ep /usr/bin/nodejs

#Comment this instruction out if it causes errors.
#RUN sudo npm install -g node-inspector

#Create a directory for customizing the new site.
VOLUME /home/p2pvps/logs

#Log into the shell as the newly created user
USER p2pvps


RUN echo 'password' | sudo -S pwd

#Use port 3000 or above if you plan to use nginx as a proxy and/or have multiple installations on the same server.
EXPOSE 5000

#Node-Inspector debug port
EXPOSE 9229
EXPOSE 9222

WORKDIR /home/p2pvps

# Clone the p2pvps-server2 repo
RUN git clone https://github.com/P2PVPS/p2pvps-server2
WORKDIR /home/p2pvps/p2pvps-server2
RUN npm install

#RUN mkdir /home/p2pvps/p2pvps-server2/persist
VOLUME /home/p2pvps/p2pvps-server2/persist
RUN sudo chown -R p2pvps /home/p2pvps/p2pvps-server2/persist

RUN npm run docs
#CMD ["npm", "start"]

#Dummy app just to get the container running with docker-compose.
#You can then enter the container with command: docker exec -it <container ID> /bin/bash
RUN npm install express
COPY dummyapp.js dummyapp.js
CMD ["node", "dummyapp.js"]
