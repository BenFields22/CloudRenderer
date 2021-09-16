# Manager/Scheduler

Nodejs express server operating as the scheduler/manager that communicates with the frontend, renderer, and DynamoDB table for job tracking. The scheduler determines whether or not to start a rendering job or place it in the queue. The system will automatically process backlogged jobs in a FIFO order.
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

## Scheduling Logic
![FlowChart for Scheduler](./Control_Flow.png)

## API
/ScheduleJob
- POST
- Attempts to start a job otherwise places in queue. Passed the name, color, and write mode. Write modes of applicaiton are 1-local file, 2-S3, 3-Both.
- Params
```json
{
    "Name":"string",
    "r":"float",
    "g":"float",
    "b":"float",
    "W":"int"
}
```
/ReportFinishedJob
- POST
- Updates state in DynamoDB and checks queue to schedule another job.
- Params
```json
{
    "Name":"string"
}
```

/removeCompleted
- POST
- Deletes complete job from DynamoDB
- Params
```json
{
    "Name":"string"
}
```
/status
- GET
- Gets the status of all jobs in queue, active jobs, and complete jobs.
