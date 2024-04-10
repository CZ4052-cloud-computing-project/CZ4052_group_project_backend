import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  DynamoDBClient,
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from "@aws-sdk/client-dynamodb";

interface LeaderboardEntry {
  position: number;
  username: string;
  numberOfSessions: number;
  totalDurationOfSessions: number;
}

export const leaderboardHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const ENDPOINT_NAME = "/leaderboard";

  if (event.httpMethod !== "GET") {
    console.log(`Unsupported HTTP method on ${ENDPOINT_NAME} endpoint.`);
    return {
      statusCode: 404,
      body: `${event.httpMethod} is not a supported HTTP method on the ${ENDPOINT_NAME} endpoint.`,
    };
  }

  if (!event.queryStringParameters || !event.queryStringParameters["date"]) {
    return {
      statusCode: 400,
      body: "Query parameter: date must be specified",
    };
  }

  const leaderboardDate = event.queryStringParameters["date"];
  console.log(`Date ${leaderboardDate}`);

  const client: DynamoDBClient = new DynamoDBClient();
  const input: ScanCommandInput = {
    TableName: "digital-detox-sessions-table",
    FilterExpression: "#dateAttr = :dateVal",
    ExpressionAttributeNames: {
      "#dateAttr": "date",
    },
    ExpressionAttributeValues: {
      ":dateVal": { S: leaderboardDate },
    },
  };
  const command: ScanCommand = new ScanCommand(input);
  const response: ScanCommandOutput = await client.send(command);
  console.log(`DynamoDB response: ${response}`);

  const leaderboardEntries = response.Items?.map((item, index) => {
    const username = item.username.S;
    if (!item.durations.L) {
      return {
        username: username,
        numberOfSessions: 0,
        totalDurationOfSessions: 0,
      };
    }
    const durations = item.durations.L.map((duration) => Number(duration.N));
    const totalDuration = durations.reduce((acc, cur) => acc + cur, 0);

    return {
      username: username,
      numberOfSessions: durations?.length,
      totalDurationOfSessions: totalDuration,
    };
  });

  leaderboardEntries
    ?.sort((a, b) => b.totalDurationOfSessions - a.totalDurationOfSessions)
    .map((entry, index) => ({ ...entry, position: index + 1 }));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date: leaderboardDate,
      leaderboard: leaderboardEntries ? leaderboardEntries : [],
    }),
  };
};
