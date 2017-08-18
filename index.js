/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';

const Alexa = require('alexa-sdk');
const https = require('https');

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'Crypto Machine',
            GET_ALL_PRICES_MESSAGE: "The prices are as follow: ",
            HELP_MESSAGE: 'Ask me for the prices of all currencies or one of them!',
            HELP_REPROMPT: 'What can I help you with?',
            STOP_MESSAGE: 'Goodbye!',
        },
    },
};


const TestResponse = {
  "version": "1.0",
  "response": {
    "outputSpeech": {
      "type": "PlainText",
      "text": "string",
    },
    "card": {
      "type": "Standard",
      "title": "Crypto Machine!",
      "content": "string",
      "text": "string",
      "image": {
        "smallImageUrl": "https://s3.amazonaws.com/cryptomachine/mim-btc-coinbase-wallet.png",
        "largeImageUrl": "https://s3.amazonaws.com/cryptomachine/mim-btc-coinbase-wallet.png"
      }
    },
    "shouldEndSession": true
  }
}


const APP_ID = 'amzn1.ask.skill.239cad52-325b-4141-aa6e-a3923ebd7f65';  // TODO replace with your app ID (OPTIONAL).

const handlers = {
    'LaunchRequest': function () {
        console.log('======================== LaunchRequest')
        this.emit('GetAllPrices');
    },
    'GetAllPrices': function () {
        console.log('======================== GetAllPrices')
    },
    'Unhandled': function () {
        console.log('======================== Unhandled')
        this.emit('GetAllPrices');
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};


const SupportedCoins = [ 'BTC' , 'ETH', 'LTC' ]

const SupportedCoinsNames = [ 'BitCoin', 'Ethereum', 'LiteCoin']

const fetchPrice = function ( coin, index, callback ){
    let req_options = { 
            host:  'api.coinbase.com', 
            path: '/v2/prices/'+ coin +'-USD/spot', 
            port: 443,
            method: 'GET'};
    var post_req = https.request(req_options, function(res) { 
            res.setEncoding('utf8'); 
            var returnData = ""; 
            res.on('data', function (chunk) { 
                returnData += chunk; 
            }); 
            res.on('end', function () {
                callback( JSON.parse(returnData).data, index )
            }); 
           });
                 post_req.end();
}

const fetchPrices = function (event, context){
    if( !event.request.intent ) event.request.intent = {name: 'GetAllPrices'}
    let requestedCoins = [];
    switch ( event.request.intent.name ){
        case 'GetAllPrices':
            requestedCoins = SupportedCoins;
        break;
        case 'GetPrice':
        // console.log('\n - - - - - - - - - - - - - - -\n')
        // console.log(event.request.intent.slots.Coin_Type.value)
        // console.log('\n - - - - - - - - - - - - - - -\n')
            requestedCoins = [`${event.request.intent.slots.Coin_Type.value}`]
        break;
        fedault:
        requestedCoins = SupportedCoins;
        // context.succeed('default!')
    }

    let responses = [];
    let counter = 0;

    for (var i = 0; i < requestedCoins.length; i ++ ) {
        fetchPrice( 
            requestedCoins[i],
            i,
            function(d, index){
                counter++;
                responses[ index ] = d;
                 if (counter == requestedCoins.length ) say( context, responses, requestedCoins )
                }
            )
    }
                
}

const say = function( context, data, requestedCoins ){
    // console.log('********************* easy speak! *********************', data)
    let responseText = "";
    for( let i = 0; i < data.length; i ++ ){
        let coinName = SupportedCoinsNames[ SupportedCoins.indexOf( (requestedCoins[i]).toUpperCase() ) ]
        responseText += `The price of ${coinName} is ${data[i].amount} ${data[i].currency}! `
    }
    TestResponse.response.outputSpeech.text = responseText;
    TestResponse.response.card.text = `Prices for:\n ${requestedCoins.join(" - ")} \n\r [ mim Armand ]`;
    context.succeed(TestResponse);
}

exports.handler = function (event, context) {
    // console.log("\n=========================================\n")
    // console.log(event.request)
    // console.log(event.request.Answer)
    // console.log(event.request.ResolvedAnaphorList)
    // console.log("\n=========================================\n")
    // console.log("\n=========================================\n")
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();

    fetchPrices ( event, context );
    // context.succeed(TestResponse);
};
