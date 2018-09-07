# foo-api

a [Sails v1](https://sailsjs.com) application that uses [Apex UP](https://github.com/apex/up) to deploy to AWS Lambda and API Gateway. We also include a [CircleCI](https://circleci.com) config that uses a [Docker container of Apex UP](https://github.com/tomsaleeba/apex-up-alpine) as part of the deployment pipeline for fully automated deployments to two environments: production and staging. The datastore is [MongoDB](www.mongodb.com/Atlas).

![infrastructure diagram](docs/infrastructure.png)

The prototype in the repo has a number of benefits:
 1. fully automated Continuous Integration and Continuous Deployment to two different environments
 1. easy local development as the app is *just* Sails.js, not an AWS Lambda function
 1. cost effective and scalable serverless hosting through AWS Lambda
 1. easy to apply a domain and SSL certificate to using API Gateway [custom domain names](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html)
 1. minimal attack surface as the app is serverless

Just note, this **IS NOT** production ready. You can read the [Sails.js deployment documentation](https://sailsjs.com/documentation/concepts/deployment) for some ideas on how to get production ready.

**About the continuous deployment support**

This repo is configured to work with CircleCI so changes are automatically deployed as you commit changes. There are two branches:
 1. `master` which is configured to deploy to the `production` stage of API Gateway
 1. `staging` which will deploy to the `staging` stage (unsurprisingly) of API Gateway

See the [Quickstart with continuous deployment from CircleCI](#quickstart-with-continuous-deployment-from-circleci) section in this README to see how to get this running with CircleCI.

**Cost estimate**

This architecture was selected with budgets in mind. AWS Lambda is very cost effective as you can see from their [examples](https://aws.amazon.com/lambda/pricing/#Lambda_pricing_examples) on the pricing page. This Lambda function is configured with 512MB of memory and if we assume each call will run for 2 seconds, then you can make **400,000 API calls every month FOR FREE!** That's forever too, it's not only for the first 12 months. There will also be some cost for S3 storage of function code and some network traffic but those will be negligible. The **biggest cost will be your database**. Costs will varying greatly depending on what you need but some options are:
 1. AWS DynamoDB (document database) that has a [free tier](https://aws.amazon.com/dynamodb/pricing/)
 1. AWS Aurora (MySQL or Postgres) T2.medium database with 50GB of storage and 1 million requests for ~$65 USD/month
 1. MongoDB Atlas (document database) M10 instance with 40GB of storage for ~$75 USD/month
 1. Google Datastore (document database) with 50GB of storage, 300k reads, 100k writes for $4 USD/month

The bottom line is it's very affordable to build a moderate sized web app that runs completely in the cloud (basically 0 ops effort) and can scale to meet large demand (as long as your DB can keep up).

## Quickstart with continuous deployment from CircleCI
Requirements:
 - Amazon AWS account (and the access + secret keys for it)
 - a GitHub account to sign up to CircleCI with
 - a MongoDB that's accessible from the internet, see www.mongodb.com/Atlas for a free DB

Steps:
1. let's get the MongoDB instance set up. Follow [this guide](https://docs.atlas.mongodb.com/getting-started/) and get a free M0 instance. See the [A note on exposing databases to the internet](#a-note-on-exposing-databases-to-the-internet) section in this README about setting up security groups so Lambda can connect to your DB, then copy the connection URL for your cluster, it'll start with something like `mongodb://username:password@some-shard-00-00-aaaa.mongodb.net:27017,...`
1. create an account with CircleCi at https://circleci.com/. It's probably easiest to use your GitHub account so you have GitHub integration set up.
1. add your AWS credentials to your CircleCI account ([instructions](https://circleci.com/docs/2.0/deployment-integrations/#aws))
1. define a [project-level environment variable](https://circleci.com/docs/2.0/env-vars/#adding-project-level-environment-variables) `MONGO_URL` with the value set to the mongo connection string you grabbed in the first step. We're going to do some hackery inject this value into the app during build because you need [UP Pro](https://up.docs.apex.sh/#guides.subscribing_to_up_pro) to get [environment variable support](https://up.docs.apex.sh/#commands.env).
1. [fork](https://help.github.com/articles/fork-a-repo/) this GitHub repo (into your own GitHub account)
1. in the CircleCI dashboard, select `Add a project`
1. find your fork of this repo in the list and select `Build project`. We already have a [workflow](https://github.com/tomsaleeba/foo-api/blob/master/.circleci/config.yml) configured so no need to do anything else
1. an initial build will be triggered and will take a few minutes. At the end the app will be deployed :D

Now we need to get the URL of the deployed app so we can interact with it. You have two options here: look at the AWS API Gateway dashboard or look at the CircleCI output. We'll document the latter here in the next section; [Get the app URL](#get-the-app-url).

### Get the app URL
You may be able to go straight to the `master` builds by replacing `tomsaleeba` with your CircleCI username in https://circleci.com/gh/tomsaleeba/workflows/foo-api/tree/master. Change `/master` with `/staging` for the other workflow. If this doesn't work for you, follow these steps:

1. go the CircleCI dashboard
1. select `Workflows` from the menu
1. select `master` from under `foo-api`

Now you're looking at the list of builds for the `master` workflow
1. hopefully the latest one has a status of `SUCCEEDED`. Select it
1. select the `deploy-prod` job in the workflow
1. expand the last step in the job, the `sh /entrypoint.sh` step

You should see output similar to
```
Production mode is ON
up version: 0.6.1

     hook: build
     hook: build (1ms)
     build: 13,432 files, 27 MB (4.068s)
     deploy: version 2 (10.295s)

URL of deployment:
https://aaabbbcccd.execute-api.ap-southeast-2.amazonaws.com/production/
```

Your URL is on the last line of that output. See the [Interacting with the API](#interacting-with-the-api) section of this README for the next steps.

## Quickstart (without continuous deployment from CircleCI)
Requirements:
 - git
 - Amazon AWS account (and the access + secret keys for it)
 - [yarn](https://yarnpkg.com) or node.js 9
 - Docker

Steps:
1. first we need to get the code
    ```bash
    git clone https://github.com/tomsaleeba/foo-api.git
    cd foo-api
    ```
1. then install the dependencies
    ```bash
    yarn # or `npm install`
    ```
1. the deployment tool needs your AWS CLI credentials passed so we'll set them as environment variables in the shell
    ```bash
    AWS_ACCESS_KEY_ID=<your key here>
    AWS_SECRET_ACCESS_KEY=<your secret here>
    ```
1. deploy the app to the `staging` stage
    ```bash
    docker run \
      --rm \
      -v $(pwd):/work \
      -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
      -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
      tomsaleeba/apex-up-alpine
    ```
1. the end of the deploy will print out the URL to access your app. Copy this URL, you'll need it later.
1. you can deploy to production by adding an extra environment variable to the staging deploy command:
    ```bash
      ...
      -e IS_PROD=1 \
      ...
    ```

See the [Interacting with the API](#interacting-with-the-api) section of this README for the next steps.

## Quickstart (running locally)

 1. install all the dependencies
    ```bash
    yarn
    ```
 1. start a MongoDB locally, using Docker
    ```bash
    docker run -p 27017:27017 --name foo-mongo -d mongo
    ```
 1. set the environment varaible so Sails knows where the DB lives
    ```bash
    export MONGO_URL='mongodb://localhost/foo'
    ```
 1. start sails
    ```bash
    sails lift
    ```

## Interacting with the API
1. set the URL of the API that you copied as an environmental variable
    ```bash
    THE_URL=<URL from the previous command output>
    # example URL: https://aaabbbcccd.execute-api.ap-southeast-2.amazonaws.com/staging
    ```
1. now it's time to create a record
    ```bash
    curl \
      -X POST \
      -H 'Content-type: application/json' \
      -d '{"name":"bob"}' \
      $THE_URL/foo
    ```
1. and lastly, list all the records (all 1 of them)
    ```bash
    curl $THE_URL/foo
    ```

The previous steps will work for either deployed stages of this app: `production` or `staging`. However, as staging is the testing ground for new features, it has something that master/production doesn't; an extra model `Bar`.

The following steps will **only** work against `staging`:
1. create a `Bar`
    ```bash
    curl \
      -X POST \
      -H 'Content-type: application/json' \
      -d '{"colour":"red"}' \
      $THE_URL/bar
    ```
1. list all the `Bar`s (all 1 of them)
    ```bash
    curl $THE_URL/bar
    ```

## Swagger
This project contains a plugin to automatically generate a swagger definition. When you start the server, it will generate a fresh definition. You can see the raw JSON at http://localhost:1337/api-docs.json or the swagger-ui at http://localhost:1337/api/docs.

## Developer workflow
Assumption: you've set up CircleCI, that's where the real value is.

From this point on, as a developer, anything you merge into `master` will be deployed to production and likewise for the `staging` branch going to staging. You can create as many other feature branches in your git repo and CircleCI will run the build step, which includes testing and linting, for all those branches. It won't do a deploy though, that only happens for `master` and `staging`. So just merge your feature branch into one of those two when you're ready for it to ship. So easy!

Here are some points to note about this workflow:
 1. every commit in the repo (on any branch) will have CI done: a build and tests are run
 1. for each commit to `master` where CI passes, a deploy to production will happen
 1. for each commit to `staging` where CI passes, a deploy to `staging` will happen
 1. if CI fails on `master` or `staging`, no deploy will happen
 1. you should do all your work on feature branches and merge to `staging` to trigger a deploy
 1. development will happen locally so `staging` should contain complete, or at least nearly complete, features
 1. if you need to handle a complex merge between `staging` (includes `feature 1`) and your `feature 2` branch,
      consider creating a separate branch to handle the merge. That way you keep your `feature 2` branch clean
      but don't lose your work doing the merge when doing future merges.

...and a diagram showing how it works:
![git workflow](docs/git-workflow.png)

## Cleaning up
### AWS
You can delete the AWS stack using the following command, run from the root of this repo:
```bash
docker run \
  --rm \
  -v $(pwd):/work \
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
  -e IS_DELETE=1 \
  tomsaleeba/apex-up-alpine
```

The important part is that we pass the `-e IS_DELETE=1` environment variable to enable "delete mode".

You'll have to manually delete the log files from CloudWatch as `up` doesn't handle them.

### GitHub
You can delete your fork on GitHub by following these instructions: https://help.github.com/articles/deleting-a-repository/

### CircleCI
You can stop CircleCI from building by following these instructions: https://circleci.com/docs/1.0/faq/#how-can-i-delete-my-project

### MongoDB Atlas
You can terminate the cluster by following these instructions: https://docs.atlas.mongodb.com/pause-terminate-cluster/

## Troubleshooting
 - If something goes wrong when you hit your API endpoint, the best place to start is AWS CloudWatch and look for the logs of your Lambda function (probably the `/aws/lambda/foo-api` log group).

 - If you add signifiant functionality to this codebase, you might have to edit `up.json` to increase the memory allocated (which also increases CPU) to the Lambda function.


 - If you get the error message:
    ```
    Error: cannot find the API, looks like you haven't deployed
    ```
    ...then run the command to delete the AWS stack to clean up. Then try again. You can find that command in the [Cleaing up](#cleaning-up) section of this README.

 - You might have stale Docker images due to [gotchas](https://github.com/moby/moby/issues/13331) in how the `:latest` tag works. Fix this by pulling the newest Docker image:
    ```bash
    docker pull tomsaleeba/apex-up-alpine
    ```

## A note on exposing databases to the internet
We're going to deploy to AWS Lambda and we don't know the IP that our code will run on because it could be *any* EC2 instance in that region. There are 3 options available:
 1. **Recommended for this test:** To easily update your MongoDB Atlas whitelist setting to allow any EC2 instance in your region to access the Mongo instance, use the [mawaws](https://www.npmjs.com/package/mongo-atlas-update-whitelist-for-aws) tool. This isn't perfect because you're still open to an attack from a whole AWS region
 1. Use [VPC peering](https://www.mongodb.com/blog/post/introducing-vpc-peering-for-mongodb-atlas) between Atlas and AWS. This is secure but requires you to deploy your Lambda function to a VPC and Apex UP currently (April 2018) can't handle configuring a VPC for you. If you're happy doing some manual configuration, you can use this option.
 1. Consider giving your Lambda a [static outgoing IP](http://techblog.financialengines.com/2016/09/26/aws-lambdas-with-a-static-outgoing-ip/) so you only need 1 IP on your Atlas whitelist. This solution also doesn't fit well with the other tools for CD in this prototype so there'll be some manual configuration required.

## TODOs
 1. document how to assign a domain name and SSL either manually in AWS web console or using `up`
 1. document how to do rollbacks using `up`
 1. create a demo of CircleCI testing if the current schema is compatible with production so we can fail the build if it can't be deployed
