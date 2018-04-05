FROM node:carbon
MAINTAINER Chris Troutner <chris.troutner@gmail.com>

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

#RUN pwd
VOLUME /usr/src/app/logs
VOLUME /usr/src/app/auth

EXPOSE 3434
#CMD [ "npm", "start" ]

#Dummy app just to get the container running with docker-compose.
#You can then enter the container with command: docker exec -it <container ID> /bin/bash
RUN npm install express
COPY dummyapp.js dummyapp.js
CMD ["node", "dummyapp.js"]
