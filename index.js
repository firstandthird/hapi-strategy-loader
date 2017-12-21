'use strict';
const _ = require('lodash');

const register = (server, config) => {
  _.forIn(config.strategies, (value, name) => {
    if (config.verbose) {
      server.log(['hapi-strategy-loader'], { message: 'strategy loaded', strategy: name, options: value });
    }
    const profileFn = _.get(value, 'options.provider.profile');
    if (typeof profileFn === 'string') {
      value.options.provider.profile = (credentials, params, get) => {
        const method = _.get(server.methods, profileFn);
        if (!method) {
          const msg = `could not find profile method ${profileFn} in server.methods`;
          server.log(['error', 'hapi-strategy-loader'], msg);
          return;
        }
        return method(credentials, params, get);
      };
    }
    const validateFn = _.get(value, 'options.validateFunc');
    if (typeof validateFn === 'string') {
      value.options.validateFunc = (request, session) => {
        const method = _.get(server.methods, validateFn);
        if (!method) {
          const msg = `could not find validate method ${validateFn} in server.methods`;
          server.log(['error', 'hapi-strategy-loader'], msg);
          return;
        }
        return method(request, session);
      };
    }
    server.auth.strategy(name, value.scheme, value.options);
    // the last-registered strategy will be the default:
    server.auth.default(name);
  });
};

exports.plugin = {
  name: 'hapi-strategy-loader',
  register,
  once: true,
  pkg: require('./package.json')
};
