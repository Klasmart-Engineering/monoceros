import { DynamoDB, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand, BatchWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { getConfigUrl } from '@kl-engineering/config'
import { EventDestination } from '../eventSender'

export class DynamoDbEventDestination<Event> implements EventDestination<Event> {
    public constructor(
        private readonly tableName: string,
        private readonly rawClient = new DynamoDB(defaultDynamoDbConfiguration),
    ) { }
    private readonly documentClient = DynamoDBDocumentClient.from(this.rawClient)

    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/batchwriteitemcommand.html
    // https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
    public async sendEvents(events: readonly Event[]) {
        try {
            const RequestItems = { [this.tableName]: transformEvents(events) } 
            const command = new BatchWriteCommand({ RequestItems })
            const { UnprocessedItems } = await this.documentClient.send(command)
            const errorCount = UnprocessedItems?.[this.tableName]?.length ?? 0;
            if(errorCount > 0) { console.log(`DynamoDb reported ${errorCount} error(s)`) }
        } catch(e) {
            console.error(e)
        }
    }
}

const transformEvents = <Event>(events: readonly Event[]): RequestItem[]  => events.map(e => transformEvent(e))

const transformEvent = <Event>(Item: Event): RequestItem  => ({ PutRequest: { Item } })

type RequestItem = BatchWriteCommandInput["RequestItems"] extends
    {[Key in string]: Array<infer Item>} | undefined
    ? Item : never

const defaultDynamoDbConfiguration: DynamoDBClientConfig = {
    endpoint: getConfigUrl('LOCALSTACK_ENDPOINT')?.toString(),
    apiVersion: '2012-08-10',
}