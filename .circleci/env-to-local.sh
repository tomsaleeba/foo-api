#!/usr/bin/env sh
# Converts environment variables to Sails local config.
# We're doing this because we don't have a Pro license
# for Apex UP, which you need for env support.
set -e
cd `dirname "$0"`
cd ..
: ${MONGO_URL:?}
: ${ROLLBAR_ENV:?}
: ${ROLLBAR_ACCESS_TOKEN:?}

target=config/local.js

# we need to escape the & character because that has special meaning to sed
fixedMongoUrl=`sh -c "echo '$MONGO_URL' | sed 's+&+\\\\\&+g'"`

echo "
module.exports = {
  datastores: {
    default: {
      url: '$fixedMongoUrl'
    },
  },
  custom: {
    rollbarEnv: '$ROLLBAR_ENV',
    rollbarAccessToken: '$ROLLBAR_ACCESS_TOKEN',
  },
}
" > $target
