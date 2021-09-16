import React from "react";
import axios from 'axios';
import Slider from "@material-ui/core/Slider";
import {Storage} from 'aws-amplify';

import './Home.css';

class Home extends React.Component {
    constructor(props, context) {
      super(props, context);
      this.showOptions = this.showOptions.bind(this);
      this.state = {
          jobsInQ:[],
          jobsActive:[],
          completeJobs:[],
          nameForJob:"N/A",
          Red:0,
          Green:0.0,
          Blue:0.0,
          imgFile:null,
          retrieveFileName:"N/A",
          showOptions:"none"
      }
    }
    
    async componentDidMount(){
      this.updateStatus();
    }

    gets3File = async (name)=> {
      try{
        var key = `${name}.png`;
        console.log("retieving file ",key);
        var file = await Storage.get(key);
        //console.log(files);
        this.setState({imgFile:file,retrieveFileName:name});
      }
      catch(err){
        console.log(err);
        return 1;
      }
      return 0;
    }

    UpdateText = (e) =>{
      this.setState({nameForJob: e.target.value});
    }

    runJob =async ()=>{
      if(this.state.nameForJob==="N/A"){
        alert("Please choose a name for the job");
        return;
      }

      var fRed = this.state.Red/255.0;
      var fGreen = this.state.Green/255.0;
      var fBlue = this.state.Blue/255.0;

      console.log("starting job with name ", this.state.nameForJob);
      console.log("Color of sphere is (",fRed.toFixed(2),",",fGreen.toFixed(2),",",fBlue.toFixed(2),")");

      var res = await axios({
                          method: 'post',
                          url: '/Schedule',
                          data: {
                            Name: this.state.nameForJob,
                            r: fRed,
                            g: fGreen,
                            b: fBlue
                          },
                          headers:{'Access-Control-Allow-Origin': '*'}
                        });
      console.log(res.data)
      this.updateStatus();
      alert(res.data);
    }

    handleChangeR=(e,newValue)=>{
      this.setState({Red:newValue});
    }
    handleChangeG=(e,newValue)=>{
      this.setState({Green:newValue});
    }
    handleChangeB=(e,newValue)=>{
      this.setState({Blue:newValue});
    }

    updateStatus= async ()=>{
      const headers = {
        'Access-Control-Allow-Origin': '*',
      };
      var res = await axios.get('/Status', { headers });
      console.log(res.data);
      var QueueNames = [];
      if(res.data.queue.length > 0){
        var queue = res.data.queue;
        for (var i=0;i<queue.length;i++){
          QueueNames.push(queue[i].Name.S)
        }
        console.log("Jobs in queue: ",QueueNames);
      }
      else{
        console.log("No jobs in queue.");
      }

      var activeNames = [];
      if(res.data.activeJobs.length > 0){
        var active = res.data.activeJobs;
        for (var j=0;j<active.length;j++){
          activeNames.push(active[j].Name.S)
        }
        console.log("Active Jobs: ",activeNames);
      }
      else{
        console.log("No jobs are active.");
      }

      var completeNames = [];
      if(res.data.completeJobs.length > 0){
        var complete = res.data.completeJobs;
        for (var k=0;k<complete.length;k++){
          completeNames.push(complete[k].Name.S)
        }
        console.log("Complete Jobs: ",completeNames);
      }
      else{
        console.log("No jobs have been completed.");
      }
      this.setState({
        jobsInQ:QueueNames,
        jobsActive:activeNames,
        completeJobs:completeNames
      });
    }

    async showOptions (name){
      var res = await this.gets3File(name);
      console.log("retrieved file from S3. Response: ",res);
      this.setState({showOptions:"block"});
    }

    closeOptions = ()=>{
      this.setState({showOptions:"none",imgFile:null});
    }

    deleteJob = async () => {
      var res = await axios({
        method: 'post',
        url: '/removeCompleted',
        data: {
          Name: this.state.retrieveFileName,
        },
        headers:{'Access-Control-Allow-Origin': '*'}
      });
      console.log(res.data)
      try{
        var res2 = await Storage.remove(`${this.state.retrieveFileName}.png`);
        console.log(res2.data);
      }catch(err){
        console.log(err);
        alert("Failed to delete Image")
        return 1;
      }
      this.setState({showOptions:"none"});
      this.updateStatus();
      alert("Image deleted ",this.state.retrieveFileName);
    }

    render() {
        if (this.props.authState === "signedIn") {
          return (
              <div className="Home">
                <div className="fileNameLabel">FileName (no file extensions)</div>
                <input className="InputText" placeholder="FileName" onChange={this.UpdateText} value={this.state.nameForJob}/>
                <div className="chosenColor" style={{"background-color":`rgb(${this.state.Red},${this.state.Green},${this.state.Blue})`}}> </div>
                <div className="sphereColorLabel">Sphere Color {`rgb(${this.state.Red},${this.state.Green},${this.state.Blue})`}</div>
                <form className="Sliders">
                  <div className="SliderLine">
                    <div className="LabelSliderRed">R:</div>
                    <Slider valueLabelDisplay="auto" min={0} max={255} value={this.state.Red} onChange={this.handleChangeR} />
                  </div>
                  <div className="SliderLine">
                    <div className="LabelSliderGreen">G:</div>
                    <Slider valueLabelDisplay="auto" min={0} max={255} value={this.state.Green} onChange={this.handleChangeG} />
                  </div>
                  <div className="SliderLine">
                    <div className="LabelSliderBlue">B:</div>
                    <Slider valueLabelDisplay="auto" min={0} max={255} value={this.state.Blue} onChange={this.handleChangeB} />
                  </div>
                </form>
                <div className="TranslateButton" onClick={()=>{this.runJob()}}>Schedule Job</div>
                <hr/>
                <div className="TranslateButton" onClick={()=>{this.updateStatus()}}>Refresh Status</div>
                <div className="JobState">
                  <div className="JobTable1">
                      <div className="TableLabel">Jobs in Queue</div>
                      <div className="scrollable">
                      <table className="center">
                        <tbody>
                          {
                            this.state.jobsInQ.map((job,i)=> {
                              return <tr key={i}><td>{job}</td></tr>
                            })
                          }
                          </tbody>
                        </table>
                      </div>
                  </div>
                  <div className="JobTable2">
                      <div className="TableLabel">Active Jobs</div>
                      <div className="scrollable">
                      <table className="center">
                        <tbody>
                          {
                            this.state.jobsActive.map((job,i) => {
                              return <tr key={i} ><td>{job}</td></tr>
                            })
                          }
                          </tbody>
                        </table>
                      </div>
                  </div>
                  <div className="JobTable3">
                      <div className="TableLabel">Complete Jobs</div>
                      <div className="scrollable">
                      <table className="center">
                          <tbody>
                            {
                              this.state.completeJobs.map( (job,i) => {
                                return <tr key={i} onClick={(e)=>{this.showOptions(job)}}><td>{job}</td></tr>
                              })
                            }
                          </tbody>
                        </table>
                      </div>
                  </div>

                </div>
                <div className="DetailsShadow" style={{display:this.state.showOptions}}>
                  <div className="DetailsContent">
                      <button><a className ="download" target="#" href={this.state.imgFile} download>Download</a></button>
                      <button onClick={this.deleteJob}>Delete</button>
                      <button onClick={this.closeOptions}>Close</button>
                      <hr/>
                      <div>{`${this.state.retrieveFileName}.png`}</div><hr/>
                      <img alt="N/A" src={this.state.imgFile}/>
                  </div>           
                </div>
              </div>
          );
        } else {
          return null;
        }
      }
    }
  
  export default Home;