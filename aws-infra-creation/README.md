# Steps to Create Infrastructure in AWS.

>## <span style="color:red">CAUTION:</span> Do not proceed unless you understand the cost implications of running infrastructure in the cloud. AWS offers a [free tier](https://aws.amazon.com/free/) for many services, but it is your responsibility to review the options and pricing for any services you might use. As a part of this system, you will want to look at the pricing for [EKS](https://aws.amazon.com/eks/pricing/), [EC2](https://aws.amazon.com/ec2/pricing/), [DynamoDB](https://aws.amazon.com/dynamodb/pricing/), [Cognito](https://aws.amazon.com/cognito/pricing/), and [S3](https://aws.amazon.com/s3/pricing/) before creating any infrastructure. As with any testing, be sure to clean up and destroy any created resources at the end to prevent further charges.

## EKS Cluster

Follow the instructions outlined in the [EKS Workshop](https://www.eksworkshop.com/) and the [Launch using eksctl](https://www.eksworkshop.com/030_eksctl/) module to easily create an EKS cluster. Once your cluster is live, proceed with [deployment](../app-deployment/aws/).
## DynamoDB Table

Create 4 tables as outlined below
1. Job_Queue
    - Name (partition key): String
    - Details: String
    - position: Number
2. active_Jobs
    - Name (partition key): String
3. complete_Jobs
    - Name (partition key): String
4. job_Counts
    - Name (partition key): String
    - Count: Number

    Need to initialize with four count items
    - Total_Scheduled=0
    - ActiveJobs=0
    - CompleteJobs=0
    - JobsInQueue=0
## Cognito User Pool and Identity Pool
Create a user pool and identity provider in Cognito and copy the user pool ID, identity pool ID, and web client ID into the app as outlined in the frontend [Build section](../src/frontend/).

## Amazon S3 Bucket
Create a bucket with any name and make sure there is a "public" folder. AWS Amplify interacts with the bucket via the public folder. The bucket name will need to be updated in the src code of the frontend and renderer. Make sure the bucket is accessible with an updated CORS policy as outlined in the [Amplify docs](https://docs.amplify.aws/lib/storage/getting-started/q/platform/js/) and the cognito IAM policies allow access. 