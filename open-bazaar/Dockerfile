# Build stage - Create static binary
FROM golang:1.8.1

#RUN apt-get -y update
#RUN apt-get -y upgrade

# Install openbazaar-go server from source.
WORKDIR /go/
RUN export GOPATH=/go
RUN go get github.com/OpenBazaar/openbazaar-go

# Initialize openbazaar go
WORKDIR /go/src/github.com/OpenBazaar/openbazaar-go
RUN git pull
#RUN git checkout altcoins-rc1
#RUN git pull
VOLUME /var/lib/openbazaar
RUN go run openbazaard.go init -d /var/lib/openbazaar
COPY config /var/lib/openbazaar/config

#WORKDIR /go/src/github.com/OpenBazaar/openbazaar-go
#COPY . .
#RUN export GOPATH=$HOME/openBazaar/server
#RUN go build --ldflags '-extldflags "-static"' -o /opt/openbazaard .

# Run stage - Import static binary, expose ports, set up volume, and run server
#FROM scratch
EXPOSE 4001 4002 9005

#COPY --from=0 /opt/openbazaard /opt/openbazaard
#COPY --from=0 /etc/ssl/certs/ /etc/ssl/certs/
#ENTRYPOINT ["/opt/openbazaard"]


CMD ["go", "run", "openbazaard.go", "start", "-d", "/var/lib/openbazaar/"]
