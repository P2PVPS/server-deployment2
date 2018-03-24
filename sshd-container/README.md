# sshd-container
This folder contains the Dockerfile and code necessary to set up SSH server running inside
a docker container. By default, this server runs on port 6100 (set by `finalSetup` script).

## Installation
* Build the docker file using docker compose:
`docker-compose build`

* Run the Docker container:
`docker-compose up -d`