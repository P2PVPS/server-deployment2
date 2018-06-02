# server-deployment

This repository is a collection of Docker files, orchestrated to work together
using Docker Compose, in order to support and run the
[P2P VPS Server](https://github.com/P2PVPS/p2pvps-server2). The software
stack can be illustrated as below, and you can read all the details in
[the specifications](http://p2pvps.org/documentation/).

![Software Stack](server-stack.jpg?raw=true "Software Stack")


## Installation (Rough Draft)
It's assumed that you are starting with a fresh installation of Ubuntu 16.04 LTS
on a 64-bit machine.
It's also assumed that you are installing as a [non-root user with sudo privileges](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-16-04).

1. Install Docker on the host system. Steps 1 and 2 in [this tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-16-04)
shows how to install Docker on a Ubuntu 16.04 system. It's specifically targeted
to Digital Ocean's cloud servers, but should work for any Ubuntu system.
Use [this link](https://m.do.co/c/8f47a23b91ce) to sign up for a Digital Ocean
account and get a $10 credit, capable of running a $5 server for two months.

2. Install Docker Compose too, following Step 1 of [this tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04).
Again, it focuses on a Ubuntu system.

* It's also a good idea to have some swap memory. Particularly if the memory of
the server you're using is 1GB or less.
[Here is a great tutorial on installing swap memory in Ubuntu 16](https://www.digitalocean.com/community/tutorials/how-to-add-swap-space-on-ubuntu-16-04).

3. Clone this repository in your home directory with the following command:<br>
`git clone https://github.com/P2PVPS/server-deployment2`

* Enter the new `server-deployment2` directory, then initialize the repository
by running `./init`.

* Initialize and configure the OpenBazaar store by running `./init-open-bazaar`.

* You'll also need to clone and install the [Listing Manager](https://github.com/P2PVPS/listing-manager),
which lives in its own repository.

* Enter the `server-deployment/sshd-container` directory and build that image with
`./buildImage`.

* Enter the `server-deployment` directory and build the server software with
this comment:<br>
`docker-compose build`

  * If you get this error:<br>
  `ERROR: Couldn't connect to Docker daemon at http+docker://localunixsocket - is it running?`<br>
  Delete the `data` directory with this command:<br>
  `sudo rm -rf data`

* Bring all the containers online by running the following command:
`docker-compose up`. Ensure there are no obvious error messages.

* Bring the containers down by hitting `Ctrl-C`.
Once back to a command line, run `docker-compose down` to clean up.
Then navigate to the the `openBazaar` directory.

* Customize the config file and then copy it into the data directory with
`sudo cp config data/`.
The current config file has username/password set as `yourUsername/yourPassword`,
and no SSL encryption on connection. Both of these should be updated.

* Go back to the `server-deployment` directory and run the containers again with
`docker-compose up -d`. The `-d` daemonizes the process, letting it run in the background.

You can also follow [these nginx instructions](nginx/README.md) to setup nginx
in front of your Docker container in order to forward traffic from port 80
(the normal web browser port) to port 3000, and also how to install
an SSL certificate from Let's Encrypt for implementing HTTPS.


## Docker Debugging
The following commands are useful for debugging applications like this one inside a Docker container. The commands
below help you to enter a shell inside the container.

* `docker ps -a`
  * Show all docker processes, including ones that are stopped.

* `docker exec -it <container ID> bash`
  * This command will let you enter a bash shell inside a running Docker container.

* `docker container run --name test-container --rm -it <Image ID> bash`
  * This command will run a docker container and drop you into a bash shell. All you need is the image ID.

If you receive the following error message when executing `docker-compose build`: <br>
_ERROR: Couldn't connect to Docker daemon at http+docker://localunixsocket - is it running?_

Then you need to delete the `data` directory and recreate it with these commands:
```
sudo rm -rf data
mkdir data
```

# License
[MIT License](LICENSE.md)
