Docker:
	docker build --build-arg REACT_APP_ID_POOL=${REACT_APP_ID_POOL} --build-arg REACT_APP_WEB_CLIENT_ID=${REACT_APP_WEB_CLIENT_ID} --build-arg REACT_APP_USER_POOL=${REACT_APP_USER_POOL} -t potatofields/ray-tracer:frontend12 .

Push:
	docker push potatofields/ray-tracer:frontend12

Run:
	docker run -p 3000:80 potatofields/ray-tracer:frontend12