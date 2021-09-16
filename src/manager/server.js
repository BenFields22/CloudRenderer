const express = require('express');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const axios = require('axios');
var bodyParser = require('body-parser');
const app = express();
const port = 8080;
const cors = require('cors');
app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.get('/', (req, res) => res.send('I am Operational'));

async function getCountOfJobDetail(i){
    var params;
    if(i===1){
        params = {
            AttributesToGet: [
              "Count"
            ],
            TableName : 'job_Counts',
            Key : { 
              "Name" : {
                "S" : "JobsInQueue"
              }
            }
          }
    }
    else if (i==2){
        params = {
            AttributesToGet: [
              "Count"
            ],
            TableName : 'job_Counts',
            Key : { 
              "Name" : {
                "S" : "ActiveJobs"
              }
            }
          }
    }
    else if (i==3){
        params = {
            AttributesToGet: [
              "Count"
            ],
            TableName : 'job_Counts',
            Key : { 
              "Name" : {
                "S" : "CompleteJobs"
              }
            }
          }
    }
    else{
        params = {
            AttributesToGet: [
              "Count"
            ],
            TableName : 'job_Counts',
            Key : { 
              "Name" : {
                "S" : "Total_Scheduled"
              }
            }
          }
    }
    var res = await ddb.getItem(params).promise();
    //console.log(res)
    return res;
}

function startJob(name, r,g,b){
    addJobToActive(name)
    var res = axios.post('http://tracer-endpoint:8080/startJob', {
        "Name":name,
        "R":r,
        "G":g,
        "B":b,
        "W":2
      });

}

async function addToScheduledCount(){
    var numScheduled = await getCountOfJobDetail(4);
    numScheduled = parseInt(numScheduled.Item.Count.N)+1;
    params = {
        TableName: "job_Counts",
        Item: {
            "Name": {
                "S": "Total_Scheduled"
            },
            "Count":{
                "N": `${numScheduled}`,
            }
        }
    }
    var resp = await ddb.putItem(params).promise();
}

async function getAllNames(){
    var data = await getJobState()
    names = []
    for(var i = 0;i<data.activeJobs.length;i++){
        var name = data.activeJobs[i].Name.S;
        names.push(name);
    }
    for(var i = 0;i<data.queue.length;i++){
        var name = data.queue[i].Name.S;
        names.push(name);
    }
    for(var i = 0;i<data.completeJobs.length;i++){
        var name = data.completeJobs[i].Name.S;
        names.push(name);
    }
    return names;
}

async function RemoveJobFromActive(name){
    var numActive = await getCountOfJobDetail(2);
    numActive = parseInt(numActive.Item.Count.N)-1;
    var params = {
        TableName: "active_Jobs",
        Key : {
            "Name": {
                "S":name
            }
        }
    };
    var resp = await ddb.deleteItem(params).promise();
    console.log("Removing job ", name, " from active");
    
    var param = {
        TableName: "job_Counts",
        Item: {
            "Name": {
                "S": "ActiveJobs"
            },
            "Count":{
                "N": `${numActive}`,
            }
        }
    }
    resp = await ddb.putItem(param).promise();
}

async function RemoveJobFromQueue(name){
    var numInQ = await getCountOfJobDetail(1);
    numInQ = parseInt(numInQ.Item.Count.N)-1;
    var params = {
        TableName: "Job_Queue",
        Key : {
            "Name": {
                "S":`${name}`
            }
        }
    };
    var resp = await ddb.deleteItem(params).promise();
    params = {
        TableName: "job_Counts",
        Item: {
            "Name": {
                "S": "JobsInQueue"
            },
            "Count":{
                "N": `${numInQ}`,
            }
        }
    }
    resp = await ddb.putItem(params).promise();
}

async function addJobToActive(name){
    var numActive = await getCountOfJobDetail(2);
    numActive = parseInt(numActive.Item.Count.N)+1;
    var params = {
        TableName: "active_Jobs",
        Item: {
            "Name": {
                "S": `${name}`
            }
        }
    };
    var resp = await ddb.putItem(params).promise();
    params = {
        TableName: "job_Counts",
        Item: {
            "Name": {
                "S": "ActiveJobs"
            },
            "Count":{
                "N": `${numActive}`,
            }
        }
    }
    resp = await ddb.putItem(params).promise();
}

async function addJobToComplete(name){
    var numComplete = await getCountOfJobDetail(3);
    numComplete = parseInt(numComplete.Item.Count.N)+1;
    var params = {
        TableName: "complete_Jobs",
        Item: {
            "Name": {
                "S": `${name}`
            }
        }
    };
    var resp = await ddb.putItem(params).promise();
    params = {
        TableName: "job_Counts",
        Item: {
            "Name": {
                "S": "CompleteJobs"
            },
            "Count":{
                "N": `${numComplete}`,
            }
        }
    }
    resp = await ddb.putItem(params).promise();
}

async function removeJobFromComplete(name){
    var numComplete = await getCountOfJobDetail(3);
    numComplete = parseInt(numComplete.Item.Count.N)-1;
    var params = {
        TableName: "complete_Jobs",
        Key : {
            "Name": {
                "S":`${name}`
            }
        }
    };
    var res = await ddb.deleteItem(params).promise();
    params = {
        TableName: "job_Counts",
        Item: {
            "Name": {
                "S": "CompleteJobs"
            },
            "Count":{
                "N": `${numComplete}`,
            }
        }
    }
    res = await ddb.putItem(params).promise();
}


async function placeJobInQ(name,details){
    var numCompleted = await getCountOfJobDetail(4);
    var numberinQ = await getCountOfJobDetail(1);
    console.log("Placing in queue")
    console.log("Details ",details)
    numCompleted = numCompleted.Item.Count.N;
    numberinQ = parseInt(numberinQ.Item.Count.N)+1;
    console.log("Number completed is ",numCompleted)
    var pos = parseInt(numCompleted) +1;
    console.log("New Position is ",pos)
    var params = {
        TableName: "Job_Queue",
        Item: {
            "Name": {
                "S": `${name}`
            },
            "details":{
                "S": JSON.stringify(details),
            },
            "position":{
                "N": `${pos}`
            },
        }
    };
    var res = await ddb.putItem(params).promise();
    console.log(res)
    params = {
        TableName: "job_Counts",
        Item: {
            "Name": {
                "S": "JobsInQueue"
            },
            "Count":{
                "N": `${numberinQ}`,
            }
        }
    }
    res = await ddb.putItem(params).promise();
    console.log(res)
}



app.post('/ScheduleJob',async (req,res)=>{
    console.log(JSON.stringify(req.body));
    //check queue if no jobs in queue then start else put in queue
    //if no queue check how many active jobs if too many then place in queue
    
    var names = await getAllNames();
    if (names.includes(req.body.Name)){
        res.status(200).send("Name already used.");
        return;
    }
    await addToScheduledCount();
    var countInQ = await getCountOfJobDetail(1);
    var activeJobs = await getCountOfJobDetail(2);
    countInQ = parseInt(countInQ.Item.Count.N);
    activeJobs = parseInt(activeJobs.Item.Count.N);
    console.log("Jobs in queue ", countInQ);
    console.log("Active Jobs ", activeJobs);
    var resp;
    if(countInQ>0){
        console.log("Jobs waiting. Adding to Queue");
        placeJobInQ(req.body.Name,{"Name":req.body.Name,"R":req.body.r,"G":req.body.g,"B":req.body.b});
        resp = "Jobs waiting. Adding to Queue";
    }
    else if(activeJobs>3){
        console.log("No jobs in Q but too many active jobs");
        console.log("Placing in Queue");
        placeJobInQ(req.body.Name,{"Name":req.body.Name,"R":req.body.r,"G":req.body.g,"B":req.body.b});
        resp = "Too many active jobs. Adding to Queue";
    }
    else{
        console.log("Scheduling Job");
        startJob(req.body.Name,req.body.r,req.body.g,req.body.b);
        resp = "Job started";
    }

    res.status(200).send(resp);
})


async function getJobState(){
    //return the active jobs
    //return jobs in queue
    //return complete jobs
    var params = {
        TableName: "Job_Queue",
    };

    let scanResults1 = [];
    var items;
    do{
        items =  await ddb.scan(params).promise();
        items.Items.forEach((item) => scanResults1.push(item));
        params.ExclusiveStartKey  = items.LastEvaluatedKey;
    }while(typeof items.LastEvaluatedKey != "undefined");

    //console.log("Items ",scanResults1);
    var jobs_in_queue = scanResults1;

    params = {
        TableName: "active_Jobs",
    };

    scanResults2 = [];
    do{
        items =  await ddb.scan(params).promise();
        items.Items.forEach((item) => scanResults2.push(item));
        params.ExclusiveStartKey  = items.LastEvaluatedKey;
    }while(typeof items.LastEvaluatedKey != "undefined");

    //console.log("Items ",scanResults2);
    var active_Jobs = scanResults2;

    params = {
        TableName: "complete_Jobs",
    };

    scanResults3 = [];
    do{
        items =  await ddb.scan(params).promise();
        items.Items.forEach((item) => scanResults3.push(item));
        params.ExclusiveStartKey  = items.LastEvaluatedKey;
    }while(typeof items.LastEvaluatedKey != "undefined");

    //console.log("Items ",scanResults3);
    var complete_Jobs = scanResults3;

    var state = {
        activeJobs : active_Jobs,
        queue:jobs_in_queue,
        completeJobs:complete_Jobs
    }
    return state;
}

app.get('/Status',async (req,res)=>{
    console.log(JSON.stringify(req.body));
    var jobState = await getJobState();
    res.status(200).send(jobState);
})

async function getNextJobFromQueue(){
    var data = await getJobState();
    var max = 99999999;
    for(var i = 0;i<data.queue.length;i++){
        var pos = parseInt(data.queue[i].position.N);
        if(pos < max){
            max = i;
        }
    }
    var next =  data.queue[max];

    return next;
}



app.post('/ReportFinishedJob', async (req,res) =>{
    console.log(JSON.stringify(req.body));
    RemoveJobFromActive(req.body.Name);
    addJobToComplete(req.body.Name);
    var numInQ = await getCountOfJobDetail(1);
    numInQ = parseInt(numInQ.Item.Count.N);
    if(numInQ > 0){
        addToScheduledCount();
        var next = await getNextJobFromQueue();
        RemoveJobFromQueue(next.Name.S);
        var mydetails = JSON.parse(next.details.S);
        startJob(next.Name.S,mydetails.R,mydetails.G,mydetails.B);
    }
    res.status(200).send("Job Reported");
})

app.post('/removeCompleted', (req,res) =>{
    console.log(JSON.stringify(req.body));
    removeJobFromComplete(req.body.Name)
    res.status(200).send("Job Removed");
})

app.get('/check',async (req,res)=>{
    console.log(JSON.stringify(req.body));
    //RemoveJobFromActive("test_active2")
    //var next = await getNextJobFromQueue();
    //console.log(next);
    //var details = JSON.parse(next.details.S);
    //console.log(details.R,details.G,details.B)
    //var names = await getAllNames();
    //console.log(names);

    //if job in queue then start the job
    res.status(200).send("Check");
})



app.listen(port, () => console.log(`Example app listening on port ${port}!`))