/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/* jshint node: true */
/*jshint esversion: 6 */
// We can use either of the following APIs:
// https://coinmarketcap.com/api/
// https://www.cryptonator.com/api/
// https://www.cryptocompare.com/api
'use strict';
const Alexa = require('alexa-sdk');
const https = require('https');
const coins = require('./coins');
const helloMessages = require('./msg_greetings').messages;
const reprompMessages = require('./msg_reprompt').messages;
const unrecognisedResponses = require('./msg_unrecognized').messages;

const APP_ID = process.env.APP_ID;
let hello_message = '';
const handlers = {
    'LaunchRequest': function() {
        console.log('======================== LaunchRequest');
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
        console.log('======================== GetPrice', this.event.request.intent.slots.cointype);
        if( !this.event.request.intent.slots.cointype.value ) this.emit('AMAZON.HelpIntent');
        let slot = this.event.request.intent.slots.cointype.value.toLowerCase();
        let sym, name;
        if (coins.syms.indexOf(slot) !== -1) {
            sym = slot;
            name = coins.name[ coins.syms.indexOf(slot) ];
        } else if (coins.name.indexOf(slot) !== -1) {
            name = slot;
            sym = coins.syms[coins.name.indexOf(slot)];
        } else this.emit('WrongCoin');
        fetchPrice(sym).then((d) => {
            this.attributes.speechOutput = `The price of ${name} is $${d.USD}`;
            this.response.speak(this.attributes.speechOutput);
            this.response.cardRenderer(
                `${sym.toUpperCase()}. © mim.Armand`,
                ` ${name.charAt(0).toUpperCase()}${name.slice(1)} (${sym.toUpperCase()}) : $${d.USD}`
                // {
                //     smallImageUrl: `https://www.cryptocompare.com/media/${coins.imgs[ coins.syms.indexOf(sym) ]}`,
                //     largeImageUrl: `https://www.cryptocompare.com/media/${coins.imgs[ coins.syms.indexOf(sym) ]}`
                // }
            );
            this.emit(':responseReady');
        });
    },
    'WrongCoin': function() {
        this.response.speak("Coin " + this.event.request.intent.slots.cointype.value + " does not exist in my database! please try a different coin!").listen();
        this.emit(':responseReady');
    },
    'Unhandled': function() {
        console.log('======================== Unhandled');
        this.attributes.unrecognizedSpeech = unrecognisedResponses[randomInRange(0, unrecognisedResponses.length)];
        this.response.speak(this.attributes.unrecognizedSpeech).listen(this.attributes.repromptSpeech);
        this.emit('RepromptRequest');
    },
    'AMAZON.HelpIntent': function() {
        const speechOutput = "Ask me for the price of a cryptocurrency coin, like Bitcoin or Ethereum!";
        const reprompt = "Ask something like: what is the price of Ethereum?!";
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', "Cool!");
    },
    'AMAZON.StopIntent': function() {
        hello_message = '';
        this.emit(':tell', "See ya!");
    },
};
const fetchPrice = function(coin) {
    return new Promise(function(resolve, reject) {
        https.get(`https://min-api.cryptocompare.com/data/price?fsym=${coin.toUpperCase()}&tsyms=USD`, (res) => {
            let rawData = "";
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            resolve( JSON.parse(rawData) );
    });
    }).on('error', (e) => {
            reject(e);
        });
        // post_req.end();
    });
};
const randomInRange = function(min, max) {
    return Math.floor((Math.random() * (max - min) + min));
};
exports.handler = function(event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    // alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};