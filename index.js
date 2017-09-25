/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
// We can use either of the following APIs:
// https://coinmarketcap.com/api/
// https://www.cryptonator.com/api/
// https://www.cryptocompare.com/api
'use strict';
const Alexa = require('alexa-sdk');
const https = require('https');
const coins = require('./coins');
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
const helloMessages = ["Hi, how can I help you today?", "Hello! let me know what you'd like to know in crypto-market?", "Hey bud! which coin you want to know the price for?", "Hello sunshine? pick a crypto currency coin so I get its status for ya!", "Welcome! Which coin you are interested in?", "Yo! What coin?!"]
const reprompMessages = ["What coin would you like to know the price about?", "You didn't say which coin!", "Try something like Bitcoin or Ethereum!", "So what is you coin of choice?", "You got to let me know which coin!"]
const unrecognisedResponses = ["Say whaaaaat! sorry but I didn't underestand what you said!", "What coin was that again?", "I'm not sure if that's even a coin! May you say it again?", "What was that?!"]
const APP_ID = 'amzn1.ask.skill.239cad52-325b-4141-aa6e-a3923ebd7f65';
let hello_message = ''
const handlers = {
    'LaunchRequest': function() {
        console.log('======================== LaunchRequest')
        this.attributes.speechOutput = helloMessages[randomInRange(0, helloMessages.length)];
        this.attributes.repromptSpeech = reprompMessages[randomInRange(0, reprompMessages.length)];
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'RepromptRequest': function() {
        this.attributes.repromptSpeech = reprompMessages[randomInRange(0, reprompMessages.length)];
        this.response.speak(this.attributes.repromptSpeech).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'GetPrice': function() {
        console.log('======================== GetPrice', this.event.request.intent.slots.cointype)
        let slot = this.event.request.intent.slots.cointype.value.toLowerCase();
        let sym, name;
        if (coins.syms.indexOf(slot) !== -1) {
            sym = slot;
            name = coins.name[ coins.syms.indexOf(slot) ]
        } else if (coins.name.indexOf(slot) !== -1) {
            name = slot;
            sym = coins.syms[coins.name.indexOf(slot)]
        } else this.emit('WrongCoin');
        fetchPrice(sym).then((d) => {
            this.attributes.speechOutput = `The price of ${name} is $${d.USD}`;
            this.response.speak(this.attributes.speechOutput);
            this.emit(':responseReady');
        })
    },
    'WrongCoin': function() {
        this.response.speak("Coin " + this.event.request.intent.slots.cointype.value + " does not exist in my database! please try a different coin!").listen();
        this.emit(':responseReady');
    },
    'Unhandled': function() {
        console.log('======================== Unhandled')
        this.attributes.unrecognizedSpeech = unrecognisedResponses[randomInRange(0, unrecognisedResponses.length)];
        this.response.speak(this.attributes.unrecognizedSpeech).listen(this.attributes.repromptSpeech);
        this.emit('RepromptRequest');
    },
    'AMAZON.HelpIntent': function() {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.RepeatIntent': function() {},
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function() {
        hello_message = '';
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};
const fetchPrice = function(coin) {
    return new Promise(function(resolve, reject) {
        https.get(`https://min-api.cryptocompare.com/data/price?fsym=${coin.toUpperCase()}&tsyms=USD`, (res) => {
            let rawData = "";
        res.on('data', (chunk) => { rawData += chunk })
        res.on('end', () => {
            resolve( JSON.parse(rawData) )
    })
    }).on('error', (e) => {
            reject(e)
        });
        // post_req.end();
    })
}
const randomInRange = function(min, max) {
    return Math.floor((Math.random() * (max - min) + min));
}
exports.handler = function(event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};