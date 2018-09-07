const sailsServerErrorDefaultResponse = require('sails/lib/hooks/responses/defaults/serverError')
const Rollbar = require('rollbar')

module.exports = function serverError(err) {
  const req = this.req
  const res = this.res
  const isRollbarDisabled = !sails.config.custom.rollbarAccessToken
  if (isRollbarDisabled) {
    return callDefaultHandler(err, req, res)
  }
  const rollbar = new Rollbar({
    accessToken: sails.config.custom.rollbarAccessToken,
    environment: sails.config.custom.rollbarEnv,
  })
  const rollbarUUID = rollbar.error(err, req, function rollbarErrorHandler (rollbarError) {
    if (rollbarError) {
      try {
        const cloneErr = {
          code: rollbarError.code,
          message: rollbarError.message,
          name: rollbarError.name,
          stack: rollbarError.stack,
          symbol: rollbarError.symbol,
        }
        sails.log.warn(`[Rollbar] Failed to send error to Rollbar, error was: ${JSON.stringify(cloneErr, null, 2)}`)
      } catch (rollbarSendError) {
        sails.log.warn(`[Rollbar] Double fail! While handling a failure to send to Rollbar, we failed again. Error=`, rollbarSendError)
      }
    } else {
      sails.log.verbose('[Rollbar] Successfully notified Rollbar of an error')
    }
    // we need to wait until the Rollbar operation has finished otherwise our code
    // will return a response and AWS Lambda will kill our execution (and we won't
    // notify Rollbar).
    return callDefaultHandler(err, req, res)
  })
  sails.log.verbose(`[Rollbar] Rollbar error notification UUID=${JSON.stringify(rollbarUUID)}, continue to follow logs for success/failure of Rollbar operation`)
}

function callDefaultHandler (err, req, res) {
  return sailsServerErrorDefaultResponse.apply({
    req: req,
    res: res,
  }, [err])
}

