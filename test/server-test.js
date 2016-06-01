'use strict';
const Hapi = require('hapi');
const Hoek = require('hoek');
const code = require('code');
const lab = exports.lab = require('lab').script();
// we will use hapi-auth-cookie as our test case:
const hapiCookie = require('hapi-auth-cookie');
const strategyLoader = require('../');

const password = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnop';
const mainCookie = 'li-sid';
const config = {
  verbose: true,
  strategies: {
    session: {
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
lab.beforeEach((done) => {
  server = new Hapi.Server({ });
  server.connection({ port: 8080 });
  server.register(hapiCookie, () => {
    done();
  });
});

lab.afterEach((done) => {
  server.stop(() => {
    done();
  });
});

lab.test('strategies are configured ', (done) => {
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

lab.test('strategy prevents access of protected routes ', (done) => {
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
        auth: 'session',
        handler: (request, reply) => {
          reply('hello!');
        }
      }
    });
    server.start(() => {
      server.inject({
        url: '/',
      }, (res) => {
        code.expect(res.statusCode).to.equal(401);
        done();
      });
    });
  });
});

lab.test('hapi-auth-cookie can set a cookie key', (done) => {
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
        auth: 'session',
        handler: (request, reply) => {
          reply('hello!');
        }
      }
    });
    server.route({
      method: 'GET', path: '/login/{user}',
      config: {
        auth: { mode: 'try' },
        handler: (request, reply) => {
          request.cookieAuth.set({ user: request.params.user });
          return reply(request.params.user);
        }
      }
    });

    server.route({
      method: 'GET', path: '/setKey', handler: (request) => {
        request.cookieAuth.set('key', 'value');
        done();
      }
    });

    server.inject('/login/steve', (res) => {
      const pattern = /(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/;
      code.expect(res.result).to.equal('steve');
      const header = res.headers['set-cookie'];
      code.expect(header.length).to.equal(1);
      code.expect(header[0]).to.contain('Max-Age=60');
      const cookie = header[0].match(pattern);

      /* eslint-disable hapi/no-shadow-relaxed */
      server.inject({ method: 'GET', url: '/setKey', headers: { cookie: `${mainCookie}=${cookie[1]}` } }, (res2) => {
        code.expect(res2.statusCode).to.equal(200);
      });
    });
  });
});

lab.test('can use a function in server.methods to validate', (done) => {
  server.methods.myValidate = (request, session, callback) => {
    const override = Hoek.clone(session);
    override.something = 'new';
    return callback(null, session.user === 'valid', override);
  };
  config.strategies.session.options.validateFunc = 'myValidate';
  server.register({
    register: strategyLoader,
    options: config
  }, (err) => {
    if (err) {
      console.log(err);
    }
    server.route({
      method: 'GET', path: '/login/{user}',
      config: {
        auth: { mode: 'try' },
        handler: (request, reply) => {
          request.cookieAuth.set({ user: request.params.user });
          return reply(request.params.user);
        }
      }
    });
    server.route({
      method: 'GET', path: '/resource', handler: (request, reply) => {
        code.expect(request.auth.credentials.something).to.equal('new');
        return reply('resource');
      }
    });
    server.inject('/login/valid', (res) => {
      const header = res.headers['set-cookie'];
      code.expect(res.result).to.equal('valid');
      code.expect(header.length).to.equal(1);
      code.expect(header[0]).to.contain('Max-Age=60');

      const cookie = header[0].match(/(?:[^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)\s*=\s*(?:([^\x00-\x20\"\,\;\\\x7F]*))/);
      server.inject({ method: 'GET', url: '/resource', headers: { cookie: `${mainCookie}=${cookie[1]}` } }, () => {
        done();
      });
    });
  });
});
