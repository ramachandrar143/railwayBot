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

app.listen(3000, () => {
    console.log("server running on 3000")
});


app.post('/', function (req, res) {
    const agent = new WebhookClient({ request: req, response: res });
    function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }
    function liveStatus(agent) {
        let trainNumber = req.body.queryResult.parameters.trainNumber;
        var options = {
            url: 'http://indianrailapi.com/api/v2/livetrainstatus/apikey/' + APIKEY + '/trainnumber/' + trainNumber + '/date/' + date.getDate()
        }
        return request(options).then(data => {
            //  console.log(data)
            data = eval('(' + data + ')');

            if (data.CurrentStation == null) {
                agent.add("Train yet to start from the source");
            }
            else {
                agent.add(new Card({
                    title: `Live Status`,
                    text: "Your train is at " + data.CurrentStation.StationName + " and late by " + data.CurrentStation.DelayInDeparture,
                    buttonText: 'Thank you!',
                    buttonUrl: 'thanks'
                }))
            }
        })
    }
    function pnrStatus(agent) {

        let pnrNumber = req.body.queryResult.parameters.pnrNumber;
        var options = {
            url: 'http://indianrailapi.com/api/v2/PNRCheck/apikey/' + APIKEY + '/PNRNumber/' + pnrNumber + '/Route/1/',
            json: true
        }
        return request(options).then(data => {
            console.log(data)
            let pnrStatus = '';
            for (var i = 0; i < data.Passangers.length; i++) {
                pnrStatus += "*" + data.Passangers[i].Passenger + "* : " + data.Passangers[i].CurrentStatus + "\n"
            }
            let status = "*_Your PNR status is_* : \n" + pnrStatus;
            agent.add(status)
        })
    }
    function seatAvailablity(agent) {
        console.log(req.body)
        let trainNumber = req.body.queryResult.parameters.trainnumber;
        let classCode = req.body.queryResult.parameters.class;
        let source = req.body.queryResult.parameters.source;
        let destination = req.body.queryResult.parameters.destination
        let date = changeFormat(req.body.queryResult.parameters.date);
        var options = {
            url: 'https://api.railwayapi.com/v2/check-seat/train/' + trainNumber + '/source/' + source + '/dest/' + destination + '/date/' + date + '/pref/' + classCode + '/quota/GN/apikey/' + RAILAPI
        }
        return request(options).then(data => {
            var jsonObj = eval('(' + data + ')');
            console.log(jsonObj.availability[0])
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
        })
    }
    function fareEnquiry(agent) {

        tcketContexts = agent.context.get('ticket_fare')
        let trainNumber = tcketContexts.parameters.trainNumber;
        let classCode = tcketContexts.parameters.classCode;
        let source = tcketContexts.parameters.source;
        let destination = tcketContexts.parameters.destination
        var options = {
            url: 'http://indianrailapi.com/api/v2/TrainFare/apikey/' + APIKEY + '/TrainNumber/' + trainNumber + '/From/' + source + '/To/' + destination + '/Quota/GN',
            json: true
        }
        return request(options).then((data) => {
            (data.Fares).filter((fare) => {

                if (fare.Code == classCode) {
                    console.log(fare)
                    agent.add(new Card({
                        title: data.TrainNumber + " | " + data.TrainName,
                        text: "It costs " + fare.Fare + " from " + source + " to " + destination
                    }))
                }
            })
        })
    }
    function TrainsBwStations(agent) {

        let source = req.body.queryResult.parameters.source;
        let destination = req.body.queryResult.parameters.destination
        var options = {
            url: 'https://indianrailapi.com/api/v2/TrainBetweenStation/apikey/' + APIKEY + '/From/' + source + '/To/' + destination,
            json: true
        }
        return request(options).then((data) => {
            if ((data.Trains).length > 10) {
                for (var i = 0; i < 10; i++) {
                    console.log(data.Trains[i])
                    
                    agent.add(new Card({
                        title: data.Trains[i].TrainNo+' | '+data.Trains[i].TrainName + " ( "+data.Trains[i].TrainType+" )",
                        text: "*Source : *"+data.Trains[i].Source+" | "+data.Trains[i].ArrivalTime+"\n *Destination : *"+data.Trains[i].Destination+ " | "+data.Trains[i].DepartureTime,
                        buttonText: 'Seat Availablity',
                        buttonUrl: 'How many Seats are available for '+data.Trains[i].TrainNo+' from '+data.Trains[i].Source+ ' to '+data.Trains[i].Destination
                    })
                    );
                }
            }
            else {
                for (var i = 0; i < (data.Trains).length; i++) {
                    console.log(data.Trains[i])
                    agent.add(new Card({
                        title: `Title: this is a card title`,
                        text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
                        buttonText: 'This is a button',
                        buttonUrl: 'https://assistant.google.com/'
                    })
                    );
                }
            }
        })
    }
    // // Uncomment and edit to make your own intent handler
    // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    // function yourFunctionHandler(agent) {
    //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
    //   agent.add(new Card({
    //       title: `Title: this is a card title`,
    //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
    //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
    //       buttonText: 'This is a button',
    //       buttonUrl: 'https://assistant.google.com/'
    //     })
    //   );
    //   agent.add(new Suggestion(`Quick Reply`));
    //   agent.add(new Suggestion(`Suggestion`));
    //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
    // }

    // // Uncomment and edit to make your own Google Assistant intent handler
    // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    // function googleAssistantHandler(agent) {
    //   let conv = agent.conv(); // Get Actions on Google library conv instance
    //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
    //   agent.add(conv); // Add Actions on Google library responses to your agent's response
    // }
    // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
    // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('train_live_status', liveStatus);
    intentMap.set('pnr_status', pnrStatus);
    intentMap.set('SEAT_AVAIL', seatAvailablity);
    intentMap.set('fareEnq', fareEnquiry);
    intentMap.set('TrainsBwStations', TrainsBwStations)
    agent.handleRequest(intentMap);

})

function changeFormat(date) {
    var todayTime = new Date(date);

    var month = (todayTime.getMonth() + 1);

    var day = (todayTime.getDate());

    var year = (todayTime.getFullYear());
    return day + "-" + month + "-" + year
}
app.get("/sayHai", function (req, res) {
    res.send("<H1>Hello World!</h1>")
})