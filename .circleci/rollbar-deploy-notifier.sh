#!/bin/bash
set -e
ACCESS_TOKEN=$ROLLBAR_ACCESS_TOKEN
ENVIRONMENT=$ROLLBAR_ENV
LOCAL_USERNAME=`whoami`
REVISION=$CIRCLE_SHA1

if [ -z "$ROLLBAR_ACCESS_TOKEN" ]; then
  echo 'No rollbar access token defined, skipping'
  exit 0
fi

curl https://api.rollbar.com/api/1/deploy/ \
  -F access_token=$ACCESS_TOKEN \
  -F environment=$ENVIRONMENT \
  -F revision=$REVISION \
  -F local_username=$LOCAL_USERNAME

echo "Notified Rollbar of deployment to env=$ENVIRONMENT, rev=$REVISION"

