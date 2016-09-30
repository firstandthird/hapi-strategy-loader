# hapi-strategy-loader  [![Build Status](https://travis-ci.org/firstandthird/hapi-strategy-loader.svg?branch=master)](https://travis-ci.org/firstandthird/hapi-strategy-loader)

### A [Hapi server](http://hapijs.com/) plugin to configure your authentication strategies

## Usage:

To use hapi-strategy-loader, you will need to have at least one [authentication strategy](http://hapijs.com/tutorials/auth) registered with your hapi server.  This example will use [hapi-auth-cookie](https://github.com/hapijs/hapi-auth-cookie) to manage session authentication.

### Install
At the command line do:

> npm install hapi-strategy-loader


### Set up your server and register an authentication strategy:
```js
const Hapi = require('hapi');
const hapiCookie = require('hapi-auth-cookie');

const server = new Hapi.Server({ });
server.connection({ port: 8080 });
// register your authentication strategies with hapi
// don't worry about the config options yet:
server.register(hapiCookie, () => {
});
```

### Register the hapi-strategy-loader plugin with config options for your strategies:
```js
// these are options recognized by hapi-auth-cookie:
  const hapiCookieOptions = {
    cookie: 'some-cookie-identifier',
    ttl: 60 * 1000,
    domain: 'example.com',
  };
  server.register({
    register: require('hapi-strategy-loader'),
    // pass any options to hapi-strategy-loader here:
    options: {
      // set verbose to true to print hapi-strategy-loader debug info:
      verbose: true,
      // list the strategies to load:
      strategies: {
        session: {
          // the 'cookie' scheme was made available when we registered hapi-auth-cookie:
          scheme: 'cookie',
          mode: 'try',
          // pass the options recognized by hapi-auth-cookie,
          // hapi-strategy-loader does not read them
          options: hapiCookieOptions
        }
      }
    }
  });
```

### You can now use the new auth scheme in your server's routes:
```js
// this route will return 401 if the user's session isn't authenticated:
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
  // you can use this route to authenticate the user's session:
  server.route({
    method: 'GET', path: '/login/{user}',
    config: {
      auth: { mode: 'try' },
      handler: (request, reply) => {
        // cookieAuth was provided by hapi-auth-cookie:
        request.cookieAuth.set({ user: request.params.user });
        return reply(request.params.user);
      }
    }
  });
```


   See the __test/__ folder for more working examples.
