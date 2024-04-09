import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import Ajv, { JSONSchemaType } from "ajv";
import {
  DynamoDBClient,
  UpdateItemCommand,
  UpdateItemCommandInput,
  UpdateItemCommandOutput,
} from "@aws-sdk/client-dynamodb";

const ajv = new Ajv();

interface DetoxSession {
  username: string;
  date: string;
  duration: number;
}

const schema: JSONSchemaType<DetoxSession> = {
  type: "object",
  properties: {
    username: { type: "string" },
    date: {
      type: "string",
      // Regex for YYYY-MM-DD format
      pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
    },
    duration: { type: "number" },
  },
  required: ["username", "date", "duration"],
  additionalProperties: false,
};

const validate = ajv.compile(schema);

export const sessionsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const ENDPOINT_NAME = "/sessions";
  if (event.httpMethod !== "POST") {
    console.log(`Unsupported HTTP method on ${ENDPOINT_NAME} endpoint.`);
    return {
      statusCode: 404,
      body: `${event.httpMethod} is not a supported HTTP method on the ${ENDPOINT_NAME} endpoint.`,
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: "Missing request body.",
    };
  }
  let detoxSession: DetoxSession;
  try {
    detoxSession = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: "Request body is not valid JSON.",
    };
  }
  const valid = validate(detoxSession);
  if (!valid) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Request body does not match the required schema.",
        errors: validate.errors,
      }),
    };
  }

  console.log(`Username: ${detoxSession.username}`);
  console.log(`Date: ${detoxSession.date}`);
  console.log(`Duration: ${detoxSession.duration}`);

  const client: DynamoDBClient = new DynamoDBClient();
  const input: UpdateItemCommandInput = {
    TableName: "digital-detox-sessions-table",
    Key: {
      username: { S: detoxSession.username },
      date: { S: detoxSession.date },
    },
    UpdateExpression:
      "SET durations = list_append(if_not_exists(durations, :empty_list), :new_duration)",
    ExpressionAttributeValues: {
      ":new_duration": { L: [{ N: detoxSession.duration.toString() }] },
      ":empty_list": { L: [] },
    },
    ReturnValues: "NONE",
  };
  const command: UpdateItemCommand = new UpdateItemCommand(input);
  const response: UpdateItemCommandOutput = await client.send(command);
  console.log(`DynamoDB response: ${response}`);

  return {
    statusCode: 201,
    body: "Detox session saved",
  };
};
