import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";

export const leaderboardHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const ENDPOINT_NAME = "/leaderboard"

    if (event.httpMethod !== "GET") {
        console.log(`Unsupported HTTP method on ${ENDPOINT_NAME} endpoint.`);
        return {
            statusCode: 404,
            body: `${event.httpMethod} is not a supported HTTP method on the ${ENDPOINT_NAME} endpoint.`
        }
    }

    if (!event.queryStringParameters || !event.queryStringParameters["date"]) {
        return {
            statusCode: 400,
            body: "Query parameter: date must be specified"
        }
    }

    console.log(`Date ${event.queryStringParameters["date"]}`);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            date: "2024-04-08",
            leaderboard: [
                {
                    position: 1,
                    username: "john",
                    numberOfSessions: 10,
                    totalDurationOfSessions: 600,
                },
                {
                    position: 2,
                    username: "tom",
                    numberOfSessions: 5,
                    totalDurationOfSessions: 300,
                }
            ]
        })
    };
};
