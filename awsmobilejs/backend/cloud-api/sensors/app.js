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
const CryptoJS = require("crypto-js");
const uuidv4 = require('uuid/v4');

AWS.config.update({ region: process.env.REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const mhprefix  = process.env.MOBILE_HUB_DYNAMIC_PREFIX;
let tableName = "sensors";
const hasDynamicPrefix = true;

const userIdPresent = true;
const partitionKeyName = "userId";
const partitionKeyType = "S"
const sortKeyName = "sensorId";
const sortKeyType = "S";
const hasSortKey = true;
const path = "/sensors";

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

const getEncryptedUser = (userId) => {
  var b64 = CryptoJS.AES.encrypt(userId, 'RMSSSimpleSensor').toString();
  var e64 = CryptoJS.enc.Base64.parse(b64);
  var eHex = e64.toString(CryptoJS.enc.Hex);

  return eHex;
}

const toHexString = (byteArray) => {
  return byteArray.reduce((output, elem) => 
    (output + ('0' + elem.toString(8)).slice(-2)),
    '');
}

const to32ByteHexKey = (strVal) => {
  for (var x = strVal.length;x < 32; x++) {
    strVal += 'S';
  }
  //console.log(strVal);
  var myBuffer = [];
  var buffer = new Buffer(strVal, 'utf8');
  for (var i = 0; i < buffer.length; i++) {
    myBuffer.push(buffer[i]);
  }
  var returnVal = toHexString(myBuffer);
  return returnVal;
}

const getUUID = () => {
  var newUUID = uuidv4();
  newUUID = newUUID.replace(/-/g, '');
  var uuidHex = to32ByteHexKey(newUUID);
  return uuidHex;
}

/********************************
 * HTTP Get method for list objects *
 ********************************/

app.get('/sensors', function(req, res) {
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
    ProjectionExpression: 'lastTemperature, registeredOn, updatedOn , sensorId , lastLux, lastHumidity, #na, batteryLevel, createdOn, userId, dataMap, stationId, sensorType, sensorStatus',
    ExpressionAttributeNames:{
        "#na": "name"
    },    
    KeyConditions: condition
  } 

  dynamodb.query(queryParams, (err, data) => {
    if (err) {
      console.log(err);
      res.json({error: 'Could not load items: ' + err});
    } else {
      //res.json(data.Items);
      res.json({sensors: data.Items})
    }
  });
});

app.get('/sensors/stationId/:stationId', function(req, res) {

  let getStationSensorsParams = {
      TableName: tableName,
      ProjectionExpression: 'lastTemperature, registeredOn, updatedOn , sensorId , lastLux, lastHumidity, #na, batteryLevel, createdOn, userId, dataMap, stationId, sensorType, sensorStatus',
      ExpressionAttributeNames:{
          "#na": "name"
      },       
      IndexName: 'stationId-index',
      KeyConditionExpression: 'stationId = :station_id',
      ExpressionAttributeValues: { ':station_id': req.params['stationId']} 
  }  

  dynamodb.query(getStationSensorsParams, (err, data) => {
    if (err) {
      console.log(err);
      res.json({error: 'Could not load items: ' + err});
    } else {
      //res.json(data.Items);
      res.json({sensors: data.Items})
    }
  });
});
/*****************************************
 * HTTP Get method for get single object *
 *****************************************/

app.get('/sensors/object/:sensorId', function(req, res) {
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
      console.log('setting ' + sortKeyName + ' to ' + req.params[sortKeyName]);
    } catch(err) {
      res.json({error: 'Wrong column type ' + err});
    }
  }

  let getItemParams = {
    TableName: tableName,
    ProjectionExpression: 'lastTemperature, registeredOn, updatedOn , sensorId , lastLux, lastHumidity, #na, batteryLevel, createdOn, userId, dataMap, stationId, sensorType, sensorStatus',    
    ExpressionAttributeNames:{
        "#na": "name"
    },     
    Key: params
  }

  dynamodb.get(getItemParams,(err, data) => {
    if(err) {
      console.log(err);
      res.json({error: 'Could not load items: ' + err.message});
    } else {
      if (data.Item) {
        res.json({sensor: data.Item});
      } else {
        res.json({sensor: data}) ;
      }
    }
  });
});

app.get('/sensors/shared/:stationId/:sensorId', function(req, res) {

  //must first get the userId of the owner through the sharedstations table
  let getSharedStationParams = {
    TableName: 'ionicsampleapp-mobilehub-970636513-sharedstations',
    ProjectionExpression: 'lastTemperature, registeredOn, updatedOn , sensorId , lastLux, lastHumidity, #na, batteryLevel, createdOn, userId, dataMap, stationId, sensorType, sensorStatus',    
    ExpressionAttributeNames:{
        "#na": "name"
    },     
    IndexName: 'shareeId-index',
    KeyConditionExpression: 'shareeId = :sharee_id',
    ExpressionAttributeValues: { ':sharee_id': req.apiGateway.event.requestContext.identity.cognitoIdentityId} 
  }

  dynamodb.query(getSharedStationParams, (err, shareddata) => {
    if (err) {
      res.json({error: 'Could not find share info: ' + err});
    } else {
      //res.json({sharedstations: shareddata.Items});
      //use the sensorId and the current logged in userId, then use the ownerId
      if (shareddata.Items)
      {
        var matchingStationOwnerId = null;
        for (var x = 0; x < shareddata.Items.length; x++)
        {
          if (shareddata.Items[x] && shareddata.Items[x].stationId)
          {
            if (shareddata.Items[x].stationId == req.params['stationId'])
            {
              var matchingStationOwnerId = shareddata.Items[x].ownerId;
              break;
            }
          }
        }
        //use the sensorId and the current logged in userId, then use the ownerId
        if (matchingStationOwnerId)
        {
          var params = {};
          if (userIdPresent && req.apiGateway) {
            params[partitionKeyName] = matchingStationOwnerId;
          } else {
            params[partitionKeyName] = matchingStationOwnerId;
          }
          if (hasSortKey) {
            try {
              params[sortKeyName] = convertUrlType(req.params[sortKeyName], sortKeyType);
              console.log('setting ' + sortKeyName + ' to ' + req.params[sortKeyName]);
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
                res.json({sensor: data.Item});
              } else {
                res.json({sensor: data}) ;
              }
            }
          });
        }
        else {
          res.json({error: 'Could not find share info: ' + err});  
        }
      }
      else {
        res.json({error: 'Could not find share info: ' + err});
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
      res.json({success: 'put call succeed!', url: req.url, sensor: req.body})
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

  if (req.body.createdOn === req.body.updatedOn && req.body.updatedOn === req.body.registeredOn)
  {
    //trying to register a new sensor
    var sKey = getUUID();
    req.body.uuid = sKey;

    let putItemParams = {
      TableName: tableName,
      Item: req.body
    }
    dynamodb.put(putItemParams, (err, data) => {
      if(err) {
        res.json({error: err, url: req.url, body: req.body});
      } else{
        console.log(data);   

        var eUser = getEncryptedUser(req.apiGateway.event.requestContext.identity.cognitoIdentityId);
        req.body.eUser = eUser;
        req.body.sKey = sKey;
        req.body.mKey = '';  
        req.body.uuid = '';      
      
        res.json({success: 'post call succeed!', url: req.url, sensor: req.body});
      }
    });    
  }
  else 
  {
    //its an update - the app can only update name, type, updatedOn
    var params = {
        TableName:tableName,
        Key:{
            "userId": req.apiGateway.event.requestContext.identity.cognitoIdentityId,
            "sensorId": req.body.sensorId
        },
        UpdateExpression: "set #na =:r, sensorType =:p, updatedOn=:a",
        ExpressionAttributeNames:{
            "#na": "name"
        },        
        ExpressionAttributeValues:{
            ":r": req.body.name,
            ":p": req.body.sensorType,
            ":a": req.body.updatedOn
        },
        ReturnValues:"UPDATED_NEW"
    };

    //console.log("Updating the item...");
    dynamodb.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            res.json({error: err, url: req.url, body: req.body});
        } else {
            res.json({success: 'post call succeed!', url: req.url, sensor: req.body});
        }
    });    
  }
});

/**************************************
* HTTP remove method to delete object *
***************************************/

app.delete('/sensors/object/:sensorId', function(req, res) {
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
