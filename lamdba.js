import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "Cloud-Computing-Project";

const MEDIAN_SOIL_READING = 3500;

const calculateStateFromSoilResponse = ({ soil }) => {
  if (soil >= MEDIAN_SOIL_READING) {
    return "ON";
  }
  return "OFF";
};

export const handler = async (event) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };
  try {
    switch (event.routeKey) {
      case "POST /soil":
        let requestJSON = JSON.parse(event.body);
        const soil = requestJSON.soil;
        await dynamo.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              id: requestJSON.id,
              soil,
              state: calculateStateFromSoilResponse({
                soil,
              }),
            },
          })
        );
        body = `Put item ${requestJSON.id} with soil reading ${requestJSON.soil}`;
        break;
      case "GET /":
        const response = await dynamo.send(
          new ScanCommand({
            TableName: tableName,
          })
        );
        body = {
          items: response.Items,
          count: response.Count,
        };
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
};