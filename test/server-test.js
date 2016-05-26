'use strict';

const Hapi = require('hapi');
const code = require('code');
const lab = exports.lab = require('lab').script();
const hapiCookie = require('hapi-auth-cookie');
const strategyLoader = require('../');

const config = {
  verbose: true,
  strategies: {
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

lab.test('strategies are configured ', (done) => {
  const server = new Hapi.Server({ });
  server.connection({ port: 8080 });
  // this example uses hapi-auth-cookie:
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
      server.start((startErr, serv) => {
        let success = false;
        try {
          server.auth.strategy('session', 'cookie', 'try', {});
        } catch (e) {
          code.expect(e.toString()).to.equal('Error: Authentication strategy name already exists');
          success = true;
        }
        code.expect(success).to.equal(true);
        done();
      });
    });
  });
});
