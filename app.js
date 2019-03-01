    var express = require('express')
var bodyParser = require('body-parser');
var request = require('request-promise')
var cors = require('cors');
var date = require('./Date.js');
var app = express();
const APIKEY = "31433211260b5f3c66b434f01d066fa7";
const RAILAPI = "vbebq9eciz"
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');

app.listen(process.env.PORT ||3000, () => {
    console.log("server running on 3000")
});

app.post('/', function (req, res) {
    const agent = new WebhookClient({ request: req, response: res });
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('train_live_status', liveStatus);
    // intentMap.set('pnr_status', pnrStatus);
    intentMap.set('SEAT_AVAIL', seatAvailablity);
    intentMap.set('fareEnq', fareEnquiry);
    //intentMap.set('seat_layout', seatLayout);
    intentMap.set('TrainsBwStations', TrainsBwStations)
    agent.handleRequest(intentMap);

    function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }
  /*  function seatLayout(agent) {
        let trainNumber = agent.parameters.number;
        var options = {
            url: "https://indianrailapi.com/api/v2/CoachLayout/apikey/" + APIKEY + "/TrainNumber/" + trainNumber,
            json: true
        }
        return request(options).then((data) => {
            console.log(data)
            console.log((data.Coaches).length);
            let str = '';
           let data1 =  new Promise(function (resolve, reject) {
                console.log("inside")
                data.Coaches.forEach(await (coach) => {
                    if(coach.SerialNo=='1')
                    this.str += "" + coach.Number
                else
                    this.str += "-->"+coach.Number
                });
                resolve(str+"fsd")
           })
            data1.then(abc => {
                console.log("dsfgs"+abc)
                agent.add(abc)
            })
            
            
        })
    }
*/
    function liveStatus(agent) {
        console.log(agent.parameters);
        console.log(date.getDate())
        let trainNumber = req.body.queryResult.parameters.trainNumber;
        let stationName = req.body.queryResult.parameters.stationName;
        if (!agent.parameters.trainNumber) {
            console.log("no train number")
            agent.add("what is your train number")
        }
        else if (!stationName) {
            console.log(date.getDate)
            agent.add("We would like to know your station code")
        }
        else {
            console.log('https://api.railwayapi.com/v2/live/train/' + trainNumber + '/station/' + stationName + '/date/' + date.getDate() + '/apikey/' + RAILAPI)
            var options = {
                url: 'https://api.railwayapi.com/v2/live/train/' + trainNumber + '/station/' + stationName + '/date/' + date.getDate() + '/apikey/' + RAILAPI,
                json:true
            }
            return request(options).then(data => {
                
                console.log(data)
                if (data.position) {
                    agent.add(data.position)
                }
            }).catch((err) => {
                console.log(err);
                agent.add("We are unable to find live status for this train")
            })
        }
    }

    function TrainsBwStations(agent) {
        let source = agent.parameters.source;
        let destination = agent.parameters.destination;
        if (!source) {
            agent.add("Please Enter your Source");
        }
        else if (!destination) {
            agent.add("Please Enter your Destination");
        }
        else {
            console.log("http://indianrailapi.com/api/v2/TrainBetweenStation/apikey/"+APIKEY+"/From/"+source+"/To/"+destination);
            var options = {
                url: "http://indianrailapi.com/api/v2/TrainBetweenStation/apikey/"+APIKEY+"/From/"+source+"/To/"+destination,
                json:true
            }
            return request(options).then(data => {
                console.log(data)
                
                if ((data.Trains).length > 10) {
                    for (i = 0; i < 10; i++){
                        let train = data.Trains[i];
                        agent.add(new Card({
                            title: train.TrainName + " | " + train.TrainNo,
                            text: "Travel time :"+train.TravelTime+", Depatures from"+source+" at "+train.ArrivalTime ,
                            buttonText: 'Seat Availablity',
                            buttonUrl: 'How many seats are available for ' + train.TrainNo
                        }))
                    }
                }
                else {
                    for (i = 0; i < data.total; i++){
                        let train = data.trains[i];
                        agent.add(new Card({
                            title: train.TrainName + " | " + train.TrainNo,
                            text: "Travel time :"+train.TravelTime+", Depatures from"+source+" at "+train.ArrivalTime ,
                            buttonText: 'Seat Availablity',
                            buttonUrl: 'How many seats are available for ' + train.TrainNo
                        }))
                    }
                }
            }).catch((err) => {
                agent.add("Sorry! we are unable to find trains between given pair of stations")
            })
        }
    }
    function seatAvailablity(agent) {
        console.log(agent.parameters)
        let trainNumber = agent.parameters.trainnumber
        let date = agent.parameters.date
        let source =  agent.parameters.source
        let destination = agent.parameters.destination
        let classCode =  agent.parameters.class
        if (!trainNumber) {
            agent.add("Please enter your train number")
        }
        else if (!agent.parameters.source) {
            agent.add("Please enter your Source station")
        }
        else if (!agent.parameters.destination) {
            agent.add("Please enter your Destination station")
        }
        else if (!date) {
            agent.add(new Suggestion('Today'));
            agent.add(new Suggestion('Tomorrow'));
        }
        else if (!classCode) {
            var options = {
                url: 'https://api.railwayapi.com/v2/route/train/' + trainNumber + '/apikey/' + RAILAPI,
                json:true
            }
            return request(options).then(data => {
                for (i = 0; i < (data.train.classes).length; i++) {
                    if (data.train.classes[i].available == "Y") {
                        console.log(data.train.classes[i].code);
                        agent.add(new Suggestion(data.train.classes[i].code))
                    }
                }
            })
        }
        else {
            console.log('https://api.railwayapi.com/v2/check-seat/train/' + trainNumber + '/source/' + source + '/dest/' + destination + '/date/' + changeFormat(date) + '/pref/' + classCode + '/quota/GN/apikey/' + RAILAPI)
            var options = {
                url: 'https://api.railwayapi.com/v2/check-seat/train/' + trainNumber + '/source/' + source + '/dest/' + destination + '/date/' + changeFormat(date) + '/pref/' + classCode + '/quota/GN/apikey/' + RAILAPI
            }
            return request(options).then(data => {
                console.log(data)
                var jsonObj = eval('(' + data + ')');
                console.log(jsonObj)
                let status = jsonObj.availability[0].status
                agent.context.set({
                    'name': 'ticket_fare',
                    'lifespan': 1,
                    'parameters': {
                        'trainNumber': trainNumber,
                        'classCode': classCode,
                        'source': source,
                        'destination': destination
                    }
                });

                agent.add(new Card({
                    title: trainNumber + " | " + classCode,
                    text: "Status : " + status,
                    buttonText: 'Fare Enquiry',
                    buttonUrl: 'How much it cost for ' + trainNumber + ' from ' + source + ' to ' + destination + ' in ' + classCode
                }))
            }).catch(err => {
                agent.add("something went wrong!")
            })
        }

    }
    function fareEnquiry(agent) {

        tcketContexts = agent.context.get('ticket_fare')
        let trainNumber = tcketContexts.parameters.trainNumber;
        let classCode = tcketContexts.parameters.classCode;
        let source = tcketContexts.parameters.source;
        let destination = tcketContexts.parameters.destination
        agent.add("");
        var options = {
            url: 'http://indianrailapi.com/api/v2/TrainFare/apikey/' + APIKEY + '/TrainNumber/' + trainNumber + '/From/' + source + '/To/' + destination + '/Quota/GN',
            json: true
        }
        return request(options).then((data) => {
            (data.Fares).filter((fare) => {

                if (fare.Code == classCode) {
                    console.log(fare)
                    console.log("It costs " + fare.Fare + " from " + source + " to " + destination)
                    agent.add("It costs " + fare.Fare + " from " + source + " to " + destination)
                }
            })
        })
    }
});

function changeFormat(date) {
    var todayTime = new Date(date);

    var month = (todayTime.getMonth() + 1);

    var day = (todayTime.getDate());

    var year = (todayTime.getFullYear());
    console.log(day + "-" + month + "-" + year)
    return day + "-" + month + "-" + year
}

app.get("/", function (req, res) {
    res.send("v2 is in production")
})