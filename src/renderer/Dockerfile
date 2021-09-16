# syntax=docker/dockerfile:1

##
## Build
##
FROM golang:1.16-buster AS build

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download
COPY *.go ./
COPY ./pkg/geom/*.go ./pkg/geom/
COPY ./pkg/trace/*.go ./pkg/trace/

RUN go build -o /rt rt.go

##
## Deploy
##
FROM gcr.io/distroless/base-debian10

WORKDIR /

COPY --from=build /rt /rt

EXPOSE 8081

USER nonroot:nonroot

ENTRYPOINT ["/rt"]
