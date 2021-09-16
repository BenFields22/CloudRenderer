Deployment configuration for an EKS environment in AWS.

Each component can be lauched via the kubectl cli so long as you are within your EKS VPC or have established connectivity.
```
kubectl apply -f ./deploy_frontend.yaml
```
```
kubectl apply -f ./deploy_manager.yaml
```
>Note that the renderer is requesting CPU resources. This can be used to fine tune your application. Setting a strategic value will allow you to distribute your render instrances evenly across available nodes. Setting the CPU request also allows you to take advantage of the Horizontal Pod Autoscaler and ultimately the cluster autoscaler. The value is set to 1.6 as I was testing with t3.small instances which have a CPU capacity of 2. Setting a value above 1 allows you to ensure that two render instances are not placed on the same node, which allows a more equal distribution of work.
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

