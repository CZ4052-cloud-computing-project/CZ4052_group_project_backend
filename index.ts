import {
  Context,
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
} from "aws-lambda";
import { sessionsHandler } from "./sessions";
import { leaderboardHandler } from "./leaderboard";
import { statisticsHandler } from "./statistics";

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log(`Event: ${JSON.stringify(event, null, 2)}`);
  console.log(`Context: ${JSON.stringify(context, null, 2)}`);

  switch (event.path) {
    case "/default/sessions":
      return sessionsHandler(event, context);
    case "/default/leaderboard":
      return leaderboardHandler(event, context);
    case "/default/statistics":
      return statisticsHandler(event, context);
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "hello world",
    }),
  };
};
