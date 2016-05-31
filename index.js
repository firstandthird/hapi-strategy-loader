'use strict';
const _ = require('lodash');

exports.register = (server, config, next) => {
  _.forIn(config.strategies, (value, name) => {
   const profileFn = _.get(value, 'options.provider.profile');
   if (typeof profileFn === 'string') {
     value.options.provider.profile = (credentials, params, get, callback) => {
       server.methods[profileFn](credentials, params, get, callback);
     };
   }
   server.auth.strategy(name, value.scheme, value.mode, value.options);
  });
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
