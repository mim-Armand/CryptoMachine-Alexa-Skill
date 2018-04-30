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
      "text": "Error! ",
    },
    "card": {
      "type": "Standard",
      "title": "Crypto Machine!",
      "content": "string",
      "text": "Error! ",
      "image": {
        "smallImageUrl": "https://s3.amazonaws.com/cryptomachine/mim-btc-coinbase-wallet.png",
        "largeImageUrl": "https://s3.amazonaws.com/cryptomachine/mim-btc-coinbase-wallet.png"
      }
    },
    "shouldEndSession": true
  }
}


const APP_ID = 'amzn1.ask.skill.239cad52-325b-4141-aa6e-a3923ebd7f65';

let hello_message = ''

const handlers = {
  'LaunchRequest': function() {
    console.log('======================== LaunchRequest')
    hello_message = 'Hi, here is a quick briefing of the market: '
    this.emit('GetPricesAll');
  },
  'GetPricesAll': function() {
    console.log('======================== GetPricesAll')
    TestResponse.response.outputSpeech.text = hello_message;
  },
  'Unhandled': function() {
    console.log('======================== Unhandled')
    this.emit('GetPricesAll');
  },
  'AMAZON.HelpIntent': function() {
    const speechOutput = this.t('HELP_MESSAGE');
    const reprompt = this.t('HELP_MESSAGE');
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },
  'AMAZON.StopIntent': function() {
    hello_message = '';
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },
};


const SupportedCoins = ['BTC', 'ETH', 'LTC']

const SupportedCoinsNames = ['BitCoin', 'Ethereum', 'LiteCoin']

const fetchPrice = function(coin, index, callback) {
  let req_options = { 
    host: 'api.coinbase.com',
     
    path: '/v2/prices/' + coin + '-USD/spot',
     
    port: 443,
    method: 'GET'
  };
  var post_req = https.request(req_options, function(res) { 
    res.setEncoding('utf8'); 
    var returnData = ""; 
    res.on('data', function(chunk) { 
      returnData += chunk; 
    }); 
    res.on('end', function() {
      callback(JSON.parse(returnData).data, index)
    });  
  }); 
  post_req.end();
}

const fetchPrices = function(event, context) {
  hello_message = '';
  if (!event.request.intent) event.request.intent = {
    name: 'GetPricesAll'
  }
  let requestedCoins = [];
  switch (event.request.intent.name) {
    case 'GetPricesAll':
      console.log(" ------> Get ALL Prices <--------- ")
      requestedCoins = SupportedCoins;
      break;
    case 'GetPrice':
      let _coinType = (event.request.intent.slots.Coin_Type.value).toUpperCase();

      _coinType = (_coinType == 'BITCOIN' || _coinType == 'BIT-COIN') ? 'BTC' :
        _coinType;
      _coinType = (_coinType == 'ETHER' || _coinType == 'ETHEREUM') ? 'ETH' :
        _coinType;
      _coinType = (_coinType == 'LITECOIN' || _coinType == 'LITE-COIN') ?
        'LTC' : _coinType;

      let all_synonyms = ['coins', 'everything', 'all', 'anything', 'market',
        'whole'
      ]
      if (all_synonyms.indexOf(_coinType.toLowerCase()) !== -1) {
        requestedCoins = SupportedCoins;
        break;
      }

      console.log(' [ [ [ [ [ [ [ [ ', SupportedCoins.indexOf(_coinType) ===
        -1, ' ] ] ] ] ] ] ]  ] ]')

      if (SupportedCoins.indexOf(_coinType) === -1) { // we indicate that the coin name is not valid and return all coins prices
        TestResponse.response.outputSpeech.text +=
          `Requested coin, ${_coinType}, was not recognized! here are the supported coins and their current valuse: `;
        requestedCoins = SupportedCoins;
      } else {
        requestedCoins = [`${_coinType}`]
      }
      console.log('\n - - - - - - - - - - - - - - -\n')
      console.log(_coinType)
      console.log('\n - - - - - - - - - - - - - - -\n')
      break;
      fedault:
        requestedCoins = SupportedCoins;
      // context.succeed('default!')
  }

  let responses = [];
  let counter = 0;

  for (var i = 0; i < requestedCoins.length; i++) {
    fetchPrice(
      requestedCoins[i],
      i,
      function(d, index) {
        counter++;
        responses[index] = d;
        if (counter == requestedCoins.length) say(context, responses,
          requestedCoins)
      }
    )
  }

}

const say = function(context, data, requestedCoins) {
  console.log('********************* easy speak! *********************', data)
  let responseText = "";
  for (let i = 0; i < data.length; i++) {
    let coinName = SupportedCoinsNames[SupportedCoins.indexOf((requestedCoins[
      i]).toUpperCase())]
    responseText +=
      `The price of ${coinName} is ${data[i].amount} ${data[i].currency}! `
  }
  responseText += ''
  TestResponse.response.outputSpeech.text += responseText;
  TestResponse.response.card.text =
    `Prices for:\n ${requestedCoins.join(" - ")} \n\r [ mim Armand ]`;
  context.succeed(TestResponse);
}

exports.handler = function(event, context) {
  console.log("\n=========================================\n")
  console.log("\n=========================================\n")
  console.log(event)
  console.log("\n=========================================\n")
  console.log(event.request.intent)
    // console.log(event.request.ResolvedAnaphorList)
  console.log("\n=========================================\n")
  console.log("\n=========================================\n")
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  // To enable string internationalization (i18n) features, set a resources object.
  alexa.resources = languageStrings;
  alexa.registerHandlers(handlers);
  alexa.execute();

  fetchPrices(event, context);
  // context.succeed(TestResponse);
};
