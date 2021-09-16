# Frontend UI for Renderer

## Build
>Note that you should replace the docker image names with your own repo/image name in the makefile. The frontend is also looking for build time args for the cognito user pool and identity pool. Get the user pool id, identity pool id, and web client id and export them as environment variables before running docker build. The env variables will need to be defined as
```
export REACT_APP_ID_POOL="XXXXX"
export REACT_APP_WEB_CLIENT_ID="XXXXX"
export REACT_APP_USER_POOL="XXXXX"
```
Build your docker image.
```
make Docker
```
Push to DockerHub
```
make Push
```

Once built and pushed refer to [deployments](../../app-deployment)

## Local Dev
Run via npm
```
npm start
```
