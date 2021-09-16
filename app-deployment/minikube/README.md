Deployment configuration for a local Minikube environment.

Each component can be lauched via the kubectl cli.
```
kubectl apply -f ./deploy_frontend.yaml
```
```
kubectl apply -f ./deploy_manager.yaml
```
```
kubectl apply -f ./deploy_renderer.yaml
```

>Note that the manager and renderer require that you have defined an environment variable with your AWS credentials (ACCESS_KEY and SECRET_ACCESS_KEY) via a secret in the k8s cluster. The format will look like the following.
```
apiVersion: v1
kind: Secret
metadata:
  name: aws-config
data:
  region: base64 of region
  access_key: base64 access key
  secret_access_key: base64 secret access key
```