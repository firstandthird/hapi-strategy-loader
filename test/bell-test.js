// verifies that npm package 'bell' will load correctly as a test case:
'use strict';

const Hapi = require('hapi');
const code = require('code');
const lab = exports.lab = require('lab').script();
const bell = require('bell');
const strategyLoader = require('../');

bell.simulate((request, next) => {
  return next(null, { some: 'value' });
});

const password = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnop';
const config = {
  strategies: {
    twitter: {
      scheme: 'bell',
      mode: 'try',
      options: {
        password,
        clientId: 'pretend_twitter_id',
        clientSecret: 'pretend_secret_id',
        isSecure: false,
        provider: {
          profile: 'profileFunc',
          auth: '/authPath',
          token: '/tokenPath',
        }
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
  server.methods.profileFunc = () => {
    return {};
  };
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

lab.test('bell strategy returns credentials ', (done) => {
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
          reply(request.auth.credentials);
        }
      }
    });
    server.start(() => {
      server.inject({
        url: '/',
      }, (res) => {
        code.expect(res.statusCode).to.equal(200);
        code.expect(JSON.parse(res.payload).provider).to.equal('custom')
        done();
      });
    });
  });
});

lab.test('bell can use profile func ', (done) => {
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
          reply(request.auth.credentials);
        }
      }
    });
    server.start(() => {
      server.inject('/?next=%2Fhome',
      (res) => {
        code.expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });
});
