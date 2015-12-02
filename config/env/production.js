/**
 * Production environment settings
 *
 * This file can include shared settings for a production environment,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  twitterKeys: {
    consumer_key: 'Ua9vWFlDDNl3JuhAEwoBOAhsY',
    consumer_secret: 'QEb1Rgh8jP83pbruez2Yb3qrD8G5aD6wtTjGO94oYJzoLQNB0s',
    access_token: '123103860-4xDjLe0OVqX2bDihoDxd6rP5nNvrN3TRzuSUz8Uw',
    access_token_secret: '2rB8q3uE3NRVckPJPOQPQtcagG2hrXQCeLv6BFecPqLPO'
  },

  /***************************************************************************
   * Set the default database connection for models in the production        *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMysqlServer'
  // },

  /***************************************************************************
   * Set the port in the production environment to 80                        *
   ***************************************************************************/

  // port: 80,

  /***************************************************************************
   * Set the log level in production environment to "silent"                 *
   ***************************************************************************/

  // log: {
  //   level: "silent"
  // }

};
