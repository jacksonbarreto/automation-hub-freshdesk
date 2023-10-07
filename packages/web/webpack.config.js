const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`
  if (!config.output) {
    config.output = {};
  }
  // Defina o publicPath dentro do objeto output
  config.output.publicPath = '/freshdesk/';
  return config;
});
