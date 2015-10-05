/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMongodbServer'
  // }

  twitterKeys: {
    consume_key: 'kdeBpqxzD6nAEZpFHeHHuCnsP',
    consumer_secret: 'ehHuPwiXMILp0Dn1fZGuLMHxXeJxoxk7L9LvbKdh0PnmcIqdZW',
    acces_token_key: '123103860-8vgX1aD3xAS4UsUsVqIZoL8KqJGrwPeeeOf3ZJOd',
    acces_token_secret: 'mpZ9trTtgzuuAA6MCw4AJOMCwGFdWoerzyWNp1V03fDEx'
  }

};
