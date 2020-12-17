/*global chrome*/


import React, { useRef, useState, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
// import Button from 'react-bootstrap/Button';
import Button from '@material-ui/core/Button';

// import Spinner from 'react-bootstrap/Spinner';
import CircularProgress from '@material-ui/core/CircularProgress';

// import ListGroup from 'react-bootstrap/ListGroup';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

// import Form from 'react-bootstrap/Form';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

import Videocam from '@material-ui/icons/Videocam';
import Modal from 'react-bootstrap/Modal'
import Pause from '@material-ui/icons/Pause';
import WbIncandescent from '@material-ui/icons/WbIncandescent';
import './App.css';
import { startProfiler, endProfiler } from '../../api/devtools';
import { getRelevantAndRankedHypotheses, getKeywords } from "../../api/hypothesizer";
import ReactHtmlParser from 'react-html-parser';

var xss = require("xss");

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
}));

function App() {
  type hypothesizerState = "idle" | "recording" | "analyzing";

  const [hypothesizerState, setHypothesizerState] = useState<hypothesizerState>("idle");
  const [results, setResults]                     = useState<any[] | null>(null);
  const [newUI, setNewUI]                         = useState(false);
  const [trace, setTrace]                         = useState<any[] | null>(null);
  const [tags, setTags]                           = useState<String[]>([]);
  const [showTags, setShowTags]                   = useState(false);
  const [showModal, setShowModal]                 = useState(false);
  const [, updateState]                           = useState();
  const forceUpdate                               = useCallback(() => updateState({}), []);
  const description                               = useRef<String>("");

  const collectDescription = (event: React.ChangeEvent<HTMLInputElement>) => {
    description.current = event.currentTarget.value;
    var keywords:String[] = getKeywords(description.current);
    setTags(keywords);
    if(keywords.length >= 1) setShowTags(true);
    else setShowTags(false);
  }

  const resetAndShowNewUI = () => {
    setHypothesizerState("idle");
    setShowModal(false);
    setNewUI(true);
    setResults([]);
    setTrace([]);
    description.current = "";
  }
  
  const removeHypothesis = (entry:any) => {
    var temp:any[] | null = results
    var toRemove = []
    for(var obj of temp!) {
      if(obj === entry) {  
        toRemove.push(obj);
      }
    }
    for(var obj of toRemove) {
      let index = temp!.indexOf(obj);
      temp!.splice(index, 1);
    }
    setResults(temp);
    forceUpdate();
  }

  const profiler = () => {
    if (hypothesizerState === "idle") {
      startProfiler();
      setHypothesizerState("recording")
    } else if (hypothesizerState === "recording") {
      setHypothesizerState("analyzing");
      setShowModal(true);
      endProfiler()
        .then(methodCoverage => getRelevantAndRankedHypotheses(description.current, methodCoverage))
        .then(hypotheses => {
          setResults(hypotheses![0]);
          setTrace(hypotheses![1]);
          setHypothesizerState("idle");
          }
        );
    }
  }

  return (
    <div className="App">
      <div className="App-header">
        <div className="myHeading">
          <WbIncandescent fontSize="large" />
          <h1>Hypothesizer</h1>
        </div>
        <h6>A debugging tool</h6>
      </div>
      <div className="App-body">
        <FormControl>
          <FormGroup controlId="exampleForm.ControlTextarea1">
            {newUI ? <Form.Label style={{ fontSize: 18 }}>Enter in the same description you entered when initially using the tool.</Form.Label> : 
            <Form.Label style={{ fontSize: 18 }}>Describe the defect generally.</Form.Label>}
            <Form.Control as="textarea" onChange={collectDescription} />
            <Form.Text className="text-muted" style={{fontSize: 12}}> 
            {showTags ? <p>Tags: {tags.map<React.ReactNode>(t => <span>{t}</span>).reduce((prev, curr) => [prev, ', ', curr])}</p> : <p></p>}
            </Form.Text>
          </FormGroup>
        </FormControl>
        {newUI ? <p style={{ fontSize: 18 }}> Please click record and reproduce the defect in the same way that you did when initially using the tool. </p> : 
        <p style={{ fontSize: 18 }}> Please click record and reproduce the defect. </p>}
      </div>
      {showModal ? 
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Title>Results</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <strong style={{fontSize: 15}}> Tags generated from your description: </strong>
            {tags.map<React.ReactNode>(t => <code>{t}</code>).reduce((prev, curr) => [prev, ', ', curr])}
            <br/>
            <strong style={{fontSize: 20}}> Hypothesis Ranking </strong>
            {hypothesizerState === "analyzing" && <div className="center"> <br></br> <CircularProgress /> {/*<Spinner animation="border" />*/} </div>}
            {hypothesizerState === "idle" && (results?.length! > 0) && 
              <div> 
                <List component="nav">
                  {results!.map(entry => <ListItem> {ReactHtmlParser("<strong>Hypothesis</strong>: " + 
                xss(entry.hypothesis) + "<br></br> <strong>Confidence: </strong>" + entry.confidence)}
                <br/>
                <Button onClick={() => removeHypothesis(entry)} variant="outlined" color="secondary"> Remove </Button> </ListItem>)} 
                </List>
              </div>
            }
            {hypothesizerState === "idle" && (results?.length! === 0) && 
              <div> 
                <List>
                  <ListItem> Hypothesizer was unable to find any potential hypotheses. You can try changing your description or <a href='javascript:;' onClick={resetAndShowNewUI}>notifying</a> Hypothesizer once you have fixed your issue.</ListItem>
                </List>
              </div>
            }
            <br></br>
            <strong style={{fontSize: 20}}> Execution Trace </strong>
            {hypothesizerState === "analyzing" && <div className="center"> <br></br> <CircularProgress />{/*<Spinner animation="border" />*/} </div>}
            {hypothesizerState === "idle" && 
              <div>
                <List>
                  {trace!.map(text => <ListItem dangerouslySetInnerHTML={{__html: xss(text)}}></ListItem>)}
                </List>
              </div>
            }  
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outlined" color="secondary" onClick={() => setShowModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal.Dialog> :  
        <div className="center">
        {hypothesizerState === "idle" &&
          <Button onClick={profiler} variant="contained" color="primary"> <Videocam /> Start Recording </Button>}
        {hypothesizerState === "recording" &&
          <Button onClick={profiler} variant="contained" color="secondary"> <Pause /> End Recording </Button>}
        </div>
      }
      <div></div>
    </div>
  );
}

export default App;
