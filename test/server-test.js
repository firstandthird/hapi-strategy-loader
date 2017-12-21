'use strict';
const Hapi = require('hapi');
const Hoek = require('hoek');
const code = require('code');
const lab = exports.lab = require('lab').script();
// we will use hapi-auth-cookie as our test case:
const hapiCookie = require('hapi-auth-cookie');
const strategyLoader = require('../index.js');

const password = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnop';
const mainCookie = 'li-sid';
const config = {
  verbose: true,
  strategies: {
    session: {
      // tells hapi that this is the default strategy to use for all routes:
      default: true,
      scheme: 'cookie',
      mode: 'try',
      options: {
        password,
        cookie: mainCookie,
        isSecure: false,
        clearInvalid: true,
        ttl: 60 * 1000,
        domain: 'example.com',
        appendNext: true
      }
    }
  }
};

let server;
lab.beforeEach(async() => {
  server = new Hapi.Server({ port: 8080 });
  await server.register(hapiCookie);
});

lab.afterEach(async() => {
  await server.stop();
});

/* eslint-disable hapi/no-shadow-relaxed */

lab.test('strategies are configured ', async() => {
  await server.register({
    plugin: strategyLoader,
    options: config
  });
  await server.start();
  let success = false;
  try {
    server.auth.strategy('session', 'cookie', {});
  } catch (e) {
    code.expect(e.toString()).to.equal('AssertionError [ERR_ASSERTION]: Authentication strategy name already exists');
    success = true;
  }
  code.expect(success).to.equal(true);
});

lab.test('strategy prevents access of protected routes ', async() => {
  await server.register({
    plugin: strategyLoader,
    options: config
  });
  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'session',
      handler: (request, h) => {
        return 'hello!';
      }
    }
  });
  await server.start();
  const res = await server.inject({ url: '/' });
  code.expect(res.statusCode).to.equal(401);
});

lab.test('hapi-auth-cookie can set a cookie key', async() => {
  await server.register({
    plugin: strategyLoader,
    options: config
  });
  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: 'session',
      handler: (request, h) => 'hello!'
    }
  });
  server.route({
    method: 'GET',
    path: '/login/{user}',
    config: {
      auth: { mode: 'try' },
      handler: (request, h) => {
        request.cookieAuth.set({ user: request.params.user });
        return request.params.user;
      }
    }
  });
  server.route({
    method: 'GET', path: '/setKey', handler: (request) => {
      request.cookieAuth.set('key', 'value');
      return 'succeeded';
    }
  });

  const res = await server.inject('/login/steve');
  const pattern = /(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/;
  code.expect(res.result).to.equal('steve');
  const header = res.headers['set-cookie'];
  code.expect(header.length).to.equal(1);
  code.expect(header[0]).to.contain('Max-Age=60');
  const cookie = header[0].match(pattern);
  const res2 = await server.inject({ method: 'GET', url: '/setKey', headers: { cookie: `${mainCookie}=${cookie[1]}` } });
  code.expect(res2.statusCode).to.equal(200);
});

lab.test('can use a function in server.methods to validate', async() => {
  server.methods.myValidate = (request, session, callback) => {
    const override = Hoek.clone(session);
    override.something = 'new';
    return { valid: session.user === 'valid' };
  };
  config.strategies.session.options.validateFunc = 'myValidate';
  await server.register({
    plugin: strategyLoader,
    options: config
  });
  server.route({
    method: 'GET',
    path: '/login/{user}',
    config: {
      auth: { mode: 'try' },
      handler: (request, h) => {
        request.cookieAuth.set({ user: request.params.user });
        return request.params.user;
      }
    }
  });
  server.route({
    method: 'GET', path: '/resource', handler: (request, h) => {
      code.expect(request.auth.credentials.something).to.equal('new');
      return 'resource';
    }
  });
  const res = await server.inject('/login/valid');
  const header = res.headers['set-cookie'];
  code.expect(res.result).to.equal('valid');
  code.expect(header.length).to.equal(1);
  code.expect(header[0]).to.contain('Max-Age=60');
  const cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
  await server.inject({ method: 'GET', url: '/resource', headers: { cookie: `${mainCookie}=${cookie[1]}` } });
});

lab.test('can use a function in a sub-folder of server.methods to validate', async() => {
  server.methods.validators = {
    myValidate: (request, session, callback) => {
      const override = Hoek.clone(session);
      override.something = 'new';
      return { valid: session.user === 'valid' };
    }
  };
  config.strategies.session.options.validateFunc = 'validators.myValidate';
  await server.register({
    plugin: strategyLoader,
    options: config
  });
  server.route({
    method: 'GET', path: '/login/{user}',
    config: {
      auth: { mode: 'try' },
      handler: (request, h) => {
        request.cookieAuth.set({ user: request.params.user });
        return request.params.user;
      }
    }
  });
  server.route({
    method: 'GET', path: '/resource', handler: (request, h) => {
      code.expect(request.auth.credentials.something).to.equal('new');
      return 'resource';
    }
  });
  const res = await server.inject('/login/valid');
  const header = res.headers['set-cookie'];
  code.expect(res.result).to.equal('valid');
  code.expect(header.length).to.equal(1);
  code.expect(header[0]).to.contain('Max-Age=60');

  const cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
  await server.inject({ method: 'GET', url: '/resource', headers: { cookie: `${mainCookie}=${cookie[1]}` } });
});

lab.test('log and throw error if a method is not available', async() => {
  server.methods.heimlich = (request, session, callback) => {
    const override = Hoek.clone(session);
    override.something = 'new';
    return callback(null, session.user === 'valid', override);
  };
  config.strategies.session.options.validateFunc = 'gorbachev sings tractors: turnip! buttocks!';
  await server.register({
    plugin: strategyLoader,
    options: config
  });
  server.route({
    method: 'GET', path: '/login/{user}',
    config: {
      auth: { mode: 'try' },
      handler: (request, h) => {
        request.cookieAuth.set({ user: request.params.user });
        return request.params.user;
      }
    }
  });
  server.route({
    method: 'GET', path: '/resource', handler: (request, h) => {
      code.expect(request.auth.error).to.exist;
      code.expect(request.auth.error.data).to.include('gorbachev');
      return '/resource';
    }
  });
  const res = await server.inject('/login/valid');
  const header = res.headers['set-cookie'];
  code.expect(res.result).to.equal('valid');
  code.expect(header.length).to.equal(1);
  code.expect(header[0]).to.contain('Max-Age=60');
  const cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
  await server.inject({ method: 'GET', url: '/resource', headers: { cookie: `${mainCookie}=${cookie[1]}` } }, (res2) => {});
});
