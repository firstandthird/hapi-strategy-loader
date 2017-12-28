// verifies that npm package 'bell' will load correctly as a test case:
'use strict';
/*
const Hapi = require('hapi');
const code = require('code');
const lab = exports.lab = require('lab').script();
const bell = require('bell');
const strategyLoader = require('../');
const _ = require('lodash');

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
bell.simulate((request, next) => {
  // verify the profileFn was loaded correctly
  code.expect(typeof config.strategies.twitter.options.provider.profile).to.equal('function');
  return next(null, {
    some: 'value',
    profileFn: _.get(request.server.methods, config.strategies.twitter.options.provider.profile)
  });
});

lab.beforeEach(async() => {
  server = new Hapi.Server({ port: 8080 });
  await server.register(bell);
  server.methods.profileFunc = () => {};
});

lab.afterEach(async() => {
  await server.stop();
});

lab.test('bell is configured with profile func', async() => {
  await server.register({
    plugin: strategyLoader,
    options: config
  });
  await server.start();
  let success = false;
  try {
    server.auth.strategy('twitter', 'bell', 'try', {});
  } catch (e) {
    code.expect(e.toString()).to.equal('Error: Authentication strategy name already exists');
    success = true;
  }
  code.expect(success).to.equal(true);
});

lab.test('bell strategy returns credentials ', async() => {
  await server.register({
    plugin: strategyLoader,
    options: config
  });
  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'twitter',
      handler: (request, h) => {
        return request.auth.credentials;
      }
    }
  });
  await server.start();
  const res = await server.inject({ url: '/' });
  code.expect(res.statusCode).to.equal(200);
  code.expect(JSON.parse(res.payload).provider).to.equal('custom')
});

lab.test('bell can use profile func specified with "." in name', async() => {
  server.methods.bellProfile = {
    profileFn: (credentials, params, get, callback) => {
      return callback({});
    }
  };
  config.strategies.twitter.options.provider.profile = 'bellProfile.profileFn';
  server.register({
    plugin: strategyLoader,
    options: config
  });
  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'twitter',
      handler: (request, h) => {
        return request.auth.credentials;
      }
    }
  });
  await server.start();
  const res = await server.inject('/?next=%2Fhome');
  code.expect(res.statusCode).to.equal(200);
});
*/
