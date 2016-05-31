// verifies that npm package 'bell' will load correctly as a test case:
'use strict';

const Hapi = require('hapi');
const code = require('code');
const lab = exports.lab = require('lab').script();
const bell = require('bell');
const strategyLoader = require('../');

const password = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnop';
const config = {
  strategies: {
    twitter: {
      scheme: 'bell',
      mode: 'try',
      options: {
        password,
        provider: 'google',
        clientId: 'pretend_twitter_id',
        clientSecret: 'pretend_secret_id',
        isSecure: false
      }
    }
  }
};

let server;
lab.beforeEach((done) => {
  server = new Hapi.Server({ });
  server.connection({ port: 8080 });
  server.register(bell, () => {
    done();
  });
});

lab.afterEach((done) => {
  server.stop(() => {
    done();
  });
});

lab.test('bell is configured with profile func', (done) => {
  server.register({
    register: strategyLoader,
    options: config
  }, (err) => {
    if (err) {
      console.log(err);
    }
    server.start(() => {
      let success = false;
      try {
        server.auth.strategy('twitter', 'bell', 'try', {});
      } catch (e) {
        code.expect(e.toString()).to.equal('Error: Authentication strategy name already exists');
        success = true;
      }
      code.expect(success).to.equal(true);
      done();
    });
  });
});

lab.test('bell strategy prevents access of protected routes ', (done) => {
  server.register({
    register: strategyLoader,
    options: config
  }, (err) => {
    if (err) {
      console.log(err);
    }
    server.route({
      method: 'GET',
      path: '/',
      config: {
        auth: 'twitter',
        handler: (request, reply) => {
          reply('hello!');
        }
      }
    });
    server.start(() => {
      server.inject({
        url: '/',
      }, (res) => {
        // bell will redirect us on auth failure:
        code.expect(res.statusCode).to.equal(302);
        done();
      });
    });
  });
});
