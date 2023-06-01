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

const sns = new AWS.SNS();

const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

const mhprefix  = process.env.MOBILE_HUB_DYNAMIC_PREFIX;
let tableName = "usersnsconfigs";
const hasDynamicPrefix = true;

const userIdPresent = true;
const partitionKeyName = "userId";
const partitionKeyType = "S"
const sortKeyName = "deviceId";
const sortKeyType = "S";
const hasSortKey = true;
const path = "/usersnsconfigs";

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

app.get('/usersnsconfigs', function(req, res) {
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
      res.json(data.Items);
    }
  });
});

/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

app.get('/usersnsconfigs/object/:deviceId', function(req, res) {
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
      res.json({success: 'put call succeed!', url: req.url, usersnsconfig: req.body})
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

  var platformAppArn = '';
  if (req.body.type == 'APNS')
  {
    //platformAppArn = 'arn:aws:sns:us-east-1:484623526573:app/APNS_SANDBOX/SimpleSensorDev';
    platformAppArn = 'arn:aws:sns:us-east-1:484623526573:app/APNS/SimpleSensor';
  }
  else if (req.body.type = 'GCM')
  {
    platformAppArn = 'arn:aws:sns:us-east-1:484623526573:app/GCM/SimpleSensorGCM';
  }

  var snsparams = {
    PlatformApplicationArn: platformAppArn, /* required */
    Token: req.body.deviceId, /* required */
    Attributes: {},
    CustomUserData: req.apiGateway.event.requestContext.identity.cognitoIdentityId
  };
  sns.createPlatformEndpoint(snsparams, function(err, data) {
    if (err)
    {
      console.log(err, err.stack); // an error occurred  
      res.json({error: err, url: req.url, body: req.body});
    } 
    else 
    {
      console.log(data);           // successful response

      req.body['snsArn'] = data.EndpointArn;

      let putItemParams = {
        TableName: tableName,
        Item: req.body
      }
      dynamodb.put(putItemParams, (err, data) => {
        if(err) {
          res.json({error: err, url: req.url, body: req.body});
        } else{
          //check to see if we want to update the shared station table
          //find user email address and update the sharedstation table with the cognitoIdentityId
          var sub = req.apiGateway.event.requestContext.identity.cognitoAuthenticationProvider;
          sub = sub.substring(sub.lastIndexOf(":") + 1, sub.length);
          var params = {
            UserPoolId: 'us-east-1_MJWuqpRNN', /* required */
            AttributesToGet: [
              'email'
            ],
            Filter:  "sub = \"" + sub + "\"",
            Limit: 1    
          };
          cognitoidentityserviceprovider.listUsers(params, function(err, userdata) {
            if (err || !userdata || !userdata.Users[0] || !userdata.Users[0].Attributes[0]) 
            {
              console.log(err, err.stack);
              res.json({success: 'post call succeed!', url: req.url, usersnsconfig: req.body});
            }
            else
            {
              //console.log(JSON.stringify(userdata.Users[0].Attributes[0].Value));
              var shareeEmail = userdata.Users[0].Attributes[0].Value;
              let getShareeParams = {
                  TableName: 'ionicsampleapp-mobilehub-970636513-sharedstations',
                  IndexName: 'shareeEmail-index',
                  KeyConditionExpression: 'shareeEmail = :shareeEmail',
                  ExpressionAttributeValues: { ':shareeEmail': shareeEmail} 
              }
              dynamodb.query(getShareeParams,(err, shareeData) => {
                  if(err) {
                      console.log('Could not load sharees: ' + err.message);
                      res.json({success: 'post call succeed!', url: req.url, usersnsconfig: req.body});
                  } else {              
                    //console.log('update sharees: ' + JSON.stringify(shareeData));
                    if (shareeData && shareeData.Items && shareeData.Items.length > 0) {
                      //console.log('updating sharees');
                      for (var i = 0; i < shareeData.Items.length; i++)
                      {
                        //console.log('updating sharee: ' + JSON.stringify(shareeData.Items[i]));
                        shareeData.Items[i].shareeId = req.apiGateway.event.requestContext.identity.cognitoIdentityId;                        
                        let putShareeItemParams = {
                          TableName: 'ionicsampleapp-mobilehub-970636513-sharedstations',
                          Item: shareeData.Items[i]
                        }
                        dynamodb.put(putShareeItemParams, (serr, sdata) => {
                          if(serr) 
                          {
                            console.log('sharee item not updated: ' + serr);
                          } 
                          else
                          {
                            console.log('sharee item updated.');
                          }
                        });                                                
                      }                      
                      res.json({success: 'post call succeed!', url: req.url, usersnsconfig: req.body});                      
                    }
                    else
                    {
                      console.log('no sharees to update');
                      res.json({success: 'post call succeed!', url: req.url, usersnsconfig: req.body});
                    }                    
                  }
              });              
            }            
          });                    
        }
      });      
    }
  });  
});

/**************************************
* HTTP remove method to delete object *
***************************************/

app.delete('/usersnsconfigs/object/:deviceId', function(req, res) {
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
