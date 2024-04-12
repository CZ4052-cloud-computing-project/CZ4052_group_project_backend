import { APIGatewayProxyEvent, Context } from "aws-lambda";
import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";

export const statisticsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
) => {
  const ENDPOINT_NAME = "/statistics";

  if (event.httpMethod !== "GET") {
    console.log(`Unsupported HTTP method on ${ENDPOINT_NAME} endpoint.`);
    return {
      statusCode: 404,
      body: `${event.httpMethod} is not a supported HTTP method on the ${ENDPOINT_NAME} endpoint.`,
    };
  }

  if (
    !event.queryStringParameters ||
    !event.queryStringParameters["username"] ||
    !event.queryStringParameters["startDate"] ||
    !event.queryStringParameters["endDate"]
  ) {
    return {
      statusCode: 400,
      body: "Query parameters: username, startDate and endDate must be specified.",
    };
  }

  const username = event.queryStringParameters["username"];
  const startDate = event.queryStringParameters["startDate"];
  const endDate = event.queryStringParameters["endDate"];

  console.log(`Username: ${username}`);
  console.log(`Start date: ${startDate}`);
  console.log(`End date: ${endDate}`);

  const client: DynamoDBClient = new DynamoDBClient();
  const input: QueryCommandInput = {
    TableName: "digital-detox-sessions-table",
    KeyConditionExpression:
      "username = :username AND #dateAttr BETWEEN :startDate AND :endDate",
    ExpressionAttributeNames: {
      "#dateAttr": "date",
    },
    ExpressionAttributeValues: {
      ":username": { S: username },
      ":startDate": { S: startDate },
      ":endDate": { S: endDate },
    },
  };
  const command: QueryCommand = new QueryCommand(input);
  const response: QueryCommandOutput = await client.send(command);
  console.log(`DynamoDB response: ${response}`);

  const stats = response.Items?.map((item) => {
    const username = item.username.S;
    const date = item.date.S;
    if (!item.durations.L) {
      return {
        date: date,
        numberOfSessions: 0,
        totalDurationOfSessions: 0,
      };
    }

    const durations = item.durations.L.map((duration) => Number(duration.N));
    const totalDuration = durations.reduce((acc, cur) => acc + cur, 0);

    return {
      date: date,
      numberOfSessions: item.durations.L.length,
      totalDurationOfSessions: totalDuration,
    };
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(stats),
  };
};
