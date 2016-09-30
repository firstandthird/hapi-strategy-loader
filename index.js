'use strict';
const _ = require('lodash');

exports.register = (server, config, next) => {
  _.forIn(config.strategies, (value, name) => {
    if (config.verbose) {
      server.log(['hapi-strategy-loader'], { message: 'strategy loaded', strategy: name, options: value });
    }
    const profileFn = _.get(value, 'options.provider.profile');
    if (typeof profileFn === 'string') {
      value.options.provider.profile = (credentials, params, get, callback) => {
        const method = _.get(server.methods, profileFn);
        if (!method) {
          const msg = `could not find profile method ${profileFn} in server.methods`;
          server.log(['error', 'hapi-strategy-loader'], msg);
          return;
        }
        method(credentials, params, get, callback);
      };
    }
    const validateFn = _.get(value, 'options.validateFunc');
    if (typeof validateFn === 'string') {
      value.options.validateFunc = (request, session, callback) => {
        const method = _.get(server.methods, validateFn);
        if (!method) {
          const msg = `could not find validate method ${validateFn} in server.methods`;
          server.log(['error', 'hapi-strategy-loader'], msg);
          return;
        }
        method(request, session, callback);
      };
    }
    server.auth.strategy(name, value.scheme, value.mode, value.options);
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
