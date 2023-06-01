/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

const express = require('express')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');

AWS.config.update({ region: process.env.REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const mhprefix  = process.env.MOBILE_HUB_DYNAMIC_PREFIX;
let tableName = "sharedstations";
const hasDynamicPrefix = true;

const userIdPresent = false;
const partitionKeyName = "stationId";
const partitionKeyType = "S"
const sortKeyName = "sharedStationId";
const sortKeyType = "S";
const hasSortKey = true;
const path = "/sharedstations";

const awsmobile = {}

if (hasDynamicPrefix) {
  tableName = mhprefix + '-' + tableName;
} 

const UNAUTH = 'UNAUTH';

// declare a new express app
var app = express()
app.use(awsServerlessExpressMiddleware.eventContext({ deleteHeaders: false }), bodyParser.json(), function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

// convert url string param to expected Type
const convertUrlType = (param, type) => {
  switch(type) {
    case "N":
      return Number.parseInt(param);
    default:
      return param;
  }
}

/********************************
 * HTTP Get method for list objects *
 ********************************/

app.get('/sharedstations/:stationId', function(req, res) {
  var condition = {}
  condition[partitionKeyName] = {
    ComparisonOperator: 'EQ'
  }
  
  if (userIdPresent && req.apiGateway) {
    condition[partitionKeyName]['AttributeValueList'] = [req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH ];
  } else {
    try {
      condition[partitionKeyName]['AttributeValueList'] = [ convertUrlType(req.params[partitionKeyName], partitionKeyType) ];
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let queryParams = {
    TableName: tableName,
    KeyConditions: condition
  } 

  dynamodb.query(queryParams, (err, data) => {
    if (err) {
      res.json({error: 'Could not load items: ' + err});
    } else {
      res.json({sharedstations: data.Items});
    }
  });
});

/**
* Get stations shared with the logged in user
*/
app.get('/sharedstations', function(req, res) {

  let getSharedStationParams = {
      TableName: tableName,
      IndexName: 'shareeId-index',
      KeyConditionExpression: 'shareeId = :sharee_id',
      ExpressionAttributeValues: { ':sharee_id': req.apiGateway.event.requestContext.identity.cognitoIdentityId} 
  }

  dynamodb.query(getSharedStationParams, (err, data) => {
    if (err) {
      res.json({error: 'Could not load items: ' + err});
    } else {
      res.json({sharedstations: data.Items});
    }
  });
});

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

app.get('/sharedstations/object/:stationId/:sharedStationId', function(req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
    try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let getItemParams = {
    TableName: tableName,
    Key: params
  }

  dynamodb.get(getItemParams,(err, data) => {
    if(err) {
      res.json({error: 'Could not load items: ' + err.message});
    } else {
      if (data.Item) {
        res.json(data.Item);
      } else {
        res.json(data) ;
      }
    }
  });
});


/************************************
* HTTP put method for insert object *
*************************************/

app.put(path, function(req, res) {
  
  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  let putItemParams = {
    TableName: tableName,
    Item: req.body
  }
  dynamodb.put(putItemParams, (err, data) => {
    if(err) {
      res.json({error: err, url: req.url, body: req.body});
    } else{
      res.json({success: 'put call succeed!', url: req.url, data: data})
    }
  });
});

/************************************
* HTTP post method for insert object *
*************************************/

app.post(path, function(req, res) {
  
  if (userIdPresent) {
    req.body['userId'] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  }

  var params = {
    UserPoolId: 'us-east-1_MJWuqpRNN', /* required */
    AttributesToGet: [
      'nickname'
    ],
    Filter:  "email = \"" + req.body.shareeEmail + "\"",
    Limit: 1    
  };
  cognitoidentityserviceprovider.listUsers(params, function(err, userdata) {

    let putItemParams = {
      TableName: tableName,
      Item: req.body
    }

    if (err || !userdata || !userdata.Users[0] || !userdata.Users[0].Attributes[0]) {
      //console.log(err, err.stack); // an error occurred
      req.body.shareeId = 'not registered';
      dynamodb.put(putItemParams, (err, data) => {
        if(err) {
          res.json({error: err, url: req.url, body: req.body});
        } else{

          //send the invitation email
          var emailparams = {
            Destination: { /* required */
              ToAddresses: [
                req.body.shareeEmail,
              ]
            },
            Source: 'info@rockymountainsmart.com', /* required */
            Template: 'SharedStation', /* required */
            TemplateData: '{ \"friend\":\"' + req.body.ownerEmail + '\" }' /* required */
          };
          // Create the promise and SES service object
          var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendTemplatedEmail(emailparams).promise();
          sendPromise.then(
            function(emaildata) {
              console.log(emaildata);
            }).catch(
              function(emailerr) {
              console.error(emailerr, emailerr.stack);
            });          

          res.json({sharedstation: req.body})
        }
      });
    }
    else 
    {
      console.log(JSON.stringify(userdata.Users[0].Attributes[0].Value));           // successful response      
      req.body.shareeId = userdata.Users[0].Attributes[0].Value;
      dynamodb.put(putItemParams, (err, data) => {
        if(err) {
          res.json({error: err, url: req.url, body: req.body});
        } else{
          res.json({sharedstation: req.body})
        }
      });      
    }
  });
});

/**************************************
* HTTP remove method to delete object *
***************************************/

app.delete('/sharedstations/object/:stationId/:sharedStationId', function(req, res) {
  var params = {};
  if (userIdPresent && req.apiGateway) {
    params[partitionKeyName] = req.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  } else {
    params[partitionKeyName] = req.params[partitionKeyName];
     try {
      params[partitionKeyName] = convertUrlType(req.params[partitionKeyName], partitionKeyType);
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }
  if (hasSortKey) {
    try {
      params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let removeItemParams = {
    TableName: tableName,
    Key: params
  }
  dynamodb.delete(removeItemParams, (err, data)=> {
    if(err) {
      res.json({error: err, url: req.url});
    } else {
      res.json({url: req.url, data: data});
    }
  });
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
