import { KinesisClient, KinesisClientConfig, PutRecordsCommand, PutRecordsRequestEntry, PutRecordsResultEntry } from '@aws-sdk/client-kinesis'
import { getConfigUrl } from '@monoceros/config'
import { EventDestination, EventError } from '../eventSender'

export class KinesisEventDestination<Event> implements EventDestination<Event> {
    public constructor(
        private readonly streamName: string,
        private readonly client = new KinesisClient(defaultKinesisConfiguration),
        private readonly serialize: { (event: Event): Buffer } = defaultJsonSerializer,
        private readonly partitionKey?: { (event: Event): string },
    ) { }

    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-kinesis/classes/putrecordscommand.html
    // https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecords.html
    public async sendEvents(events: readonly Event[]) {
        try {
            const StreamName = this.streamName;
            const Records = events.map(e => this.transformEvent(e));
            const command = new PutRecordsCommand({ StreamName, Records });
            const result = await this.client.send(command);
            const { errorCount } = filterErrors(result.Records, events)
            if(errorCount > 0) {console.log(`Kinesis reported ${errorCount} error(s)`)}
        } catch(e) {
            console.error(e)
        }
    }

    private transformEvent(event: Event): PutRecordsRequestEntry {
        return {
            PartitionKey: this.partitionKey?.(event),
            Data: this.serialize(event),
        }
    }
}

const filterErrors = <Event>(
    items: PutRecordsResultEntry[] | undefined,
    events: readonly Event[],
) => {
    const errors: EventError<Event, PutRecordsResultEntry>[] = []
    let missingErrorCount = 0;

    items?.forEach((error, i) => {
        if(error.ErrorCode === undefined) { return; }
        const event = events[i];
        if(!event) { missingErrorCount++; return; }
        errors.push({ error, event })
    })

    const errorCount = errors.length + missingErrorCount
    return {
        errors,
        missingErrorCount,
        errorCount,
    }
}

const defaultJsonSerializer = (x: unknown) => Buffer.from(`${JSON.stringify(x)}\n`);

const defaultKinesisConfiguration: KinesisClientConfig = {
    endpoint: getConfigUrl('LOCALSTACK_ENDPOINT')?.toString(),
} 