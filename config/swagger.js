module.exports.swagger = {
  apiVersion: '1.0',
  swaggerVersion: '2.0',
  swaggerURL: '/api/docs',
  swaggerJSON: '/api-docs.json',
  basePath: process.env.HOST_NAME||'http://localhost:1337',
  info: {
    title: ' App API Documentation',
    description: ' API Swagger'
  },
  apis: [
    //"Users.yml"
  ]
}
