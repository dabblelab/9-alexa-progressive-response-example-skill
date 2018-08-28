const Alexa = require('ask-sdk');
const axios = require('axios');

const GetAstronautCountHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest' || (request.type === 'IntentRequest' && request.intent.name === 'getAstronautCountIntent');
  },
  async handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    
    var totalAstronauts;
    try {
      //Call the progressive response service
      await callDirectiveService(handlerInput);

    } catch (err) {
      // if it failed we can continue, just the user will wait longer for first response
      console.log("error : " + err);
    }
    try {
      //Make the external API call which will take time
      await axios.get('http://api.open-notify.org/astros.json')
      .then(res => res.data)
      .then(res => {
          totalAstronauts = res.number;
      })

      // Now create the normal response
      // let's purposely insert a 5 second delay for this demo. You should add enough delay to get the response back from API.

      // shouldn't go longer than 5 seconds else lambda might time out
      await sleep(5000);

      let speechOutput = `There are currently ${totalAstronauts} astronauts in space. `;
        return responseBuilder
          .speak(speechOutput)
          .getResponse();
      
    } catch (err) {
      console.log(`Error processing events request: ${err}`);
      return responseBuilder
        .speak('error')
        .getResponse();
    }
  },
};

const AmazonHelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    return responseBuilder
      .speak("Ask progressive space control how many astronauts are in space.")
      .reprompt("Ask progressive space control how many astronauts are in space.")
      .getResponse();
  },
};

const AmazonCancelStopNoHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    const speechOutput = 'Okay, talk to you later! ';

    return responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const request = handlerInput.requestEnvelope.request;

    console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);
    console.log(`Error handled: ${error}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can not understand the command.  Please say again.')
      .reprompt('Sorry, I can not understand the command.  Please say again.')
      .getResponse();
  },
};


function callDirectiveService(handlerInput) {
  // Call Alexa Directive Service.
  const requestEnvelope = handlerInput.requestEnvelope;
  const directiveServiceClient = handlerInput.serviceClientFactory.getDirectiveServiceClient();

  const requestId = requestEnvelope.request.requestId;
  const endpoint = requestEnvelope.context.System.apiEndpoint;
  const token = requestEnvelope.context.System.apiAccessToken;

  // build the progressive response directive
  const directive = {
    header: {
      requestId,
    },
    directive:{ 
        type:"VoicePlayer.Speak",
        speech:"Space is a bit far way. Wait till I get back the information from ISS."
    },
  };
  // send directive
  return directiveServiceClient.enqueue(directive, endpoint, token);
}



function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve(), milliseconds));
 }
 
// const getRemoteData = function (url) {
//   return new Promise((resolve, reject) => {
//     const client = url.startsWith('https') ? require('https') : require('http');
//     const request = client.get(url, (response) => {
//       if (response.statusCode < 200 || response.statusCode > 299) {
//         reject(new Error('Failed with status code: ' + response.statusCode));
//       }
//       const body = [];
//       response.on('data', (chunk) => body.push(chunk));
//       response.on('end', () => resolve(body.join('')));
//     });
//     request.on('error', (err) => reject(err))
//   })
// };


// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    GetAstronautCountHandler,
    AmazonHelpHandler,
    AmazonCancelStopNoHandler,
    SessionEndedHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();