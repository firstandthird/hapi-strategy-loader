'use strict';
const _ = require('lodash');

exports.register = (server, config, next) => {
  // set up logging:
  const log = (tags, content) => {
    if (!config.verbose) {
      return;
    }
    server.log(tags, content);
  };
  log(['hapi-strategy-loader', { msg: 'Loading strategy plugins' }]);
  _.forIn(config.strategies, (value, name) => {
    log(['hapi-strategy-loader'], { message: 'strategy loaded', strategy: name, options: value });
    const profileFn = _.get(value, 'options.provider.profile');
    if (typeof profileFn === 'string') {
      value.options.provider.profile = (credentials, params, get, callback) => {
        server.methods[profileFn](credentials, params, get, callback);
      };
    }
    server.auth.strategy(name, value.scheme, value.mode, value.options);
  });
  log(['hapi-strategy-loader'], { msg: 'Strategies and plugins loaded' });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
