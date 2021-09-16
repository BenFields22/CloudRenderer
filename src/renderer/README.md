# Renderer
Ray tracer based on [_Ray Tracing in One Weekend_](https://raytracing.github.io/books/RayTracingInOneWeekend.html). Implementation in Go extended from Hunter Loftis' [repo](https://github.com/hunterloftis/oneweekend). Ray tracer was wrapped with a web api and extended to communicate with Amazon S3 and work with in memory .PNG files instead of file system .PPM.
## Build
>Note that you should replace the docker image names with your own repo/image name in the makefile.
Build your docker image.
```
make Docker
```
Push to DockerHub
```
make Push
```
Once built and pushed refer to [deployments](../../app-deployment)

## Example Render
![Example](../../Example.png)