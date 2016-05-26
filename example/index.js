'use strict';
const Hapi = require('hapi');
const strategyLoader = require('../');
// this example uses hapi-auth-cookie as the auth provider:
const hapiCookie = require('hapi-auth-cookie');

// a sample strategy config:
const config = {
  // verbose tells the plugin to print verbose feedback:
  verbose: true,
  strategies: {
    // the strategy for managing session:
    session: {
      scheme: 'cookie',
      mode: 'try',
      options: {
        password: 'asdf',
        cookie: 'li-sid',
        isSecure: false,
        clearInvalid: true,
        appendNext: true
      }
    }
  }
};

const server = new Hapi.Server({ });
server.connection({ port: 8080 });
server.register(hapiCookie, (authErr) => {
  if (authErr) {
    console.log(authErr);
  }
  server.register({
    register: strategyLoader,
    options: config
  }, (err) => {
    if (err) {
      console.log(err);
    }
    server.start((startErr) => {
      if (startErr) {
        throw startErr;
      }
      console.log('server started and listening on port 8080');
    });
  });
});
