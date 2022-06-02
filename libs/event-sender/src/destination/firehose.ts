import { FirehoseClient, FirehoseClientConfig, PutRecordBatchCommand, PutRecordBatchResponseEntry, _Record } from '@aws-sdk/client-firehose'
import { getConfigUrl } from '@kl-engineering/config';
import { EventDestination, EventError } from '../eventSender'

export class FirehoseEventDestination<Event> implements EventDestination<Event> {
  public constructor(
    private readonly deliveryStreamName: string,
    private readonly client = new FirehoseClient(defaultFirehoseConfiguration),
    private readonly serialize: { (event: Event): Buffer } = defaultJsonSerializer
  ) { }

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-firehose/classes/putrecordbatchcommand.html
  // https://docs.aws.amazon.com/firehose/latest/APIReference/API_PutRecordBatch.html
  public async sendEvents(events: readonly Event[]) {
    try {
      const DeliveryStreamName = this.deliveryStreamName;
      const Records = events.map(e => this.recordTransform(e));
      const command = new PutRecordBatchCommand({ DeliveryStreamName, Records });
      const { RequestResponses } = await this.client.send(command);
      const { errorCount } = filterErrors(RequestResponses, events);
      if(errorCount > 0) {console.log(`Firehose reported ${errorCount} error(s)`)}
    } catch(e) {
      console.error(e);
    }
  }

  private recordTransform(event: Event): _Record {
    return {
      Data: this.serialize(event),
    }
  }
}

const filterErrors = <T>(
    items: PutRecordBatchResponseEntry[] | undefined,
    events: readonly T[],
) => {
  const errors: EventError<T, PutRecordBatchResponseEntry>[] = []
    let missingEventCount = 0;
    
    items?.forEach((error, i) => {
        if(error.ErrorCode === undefined) { return; }
        const event = events[i];
        if(!event) { missingEventCount++; return; }
        errors.push({ error, event });
    })

    const errorCount = errors.length + missingEventCount
    return {
        errors,
        missingEventCount,
        errorCount,
    }
};


const defaultJsonSerializer = (x: unknown) => Buffer.from(`${JSON.stringify(x)}\n`);

const defaultFirehoseConfiguration: FirehoseClientConfig = {
  endpoint: getConfigUrl('LOCALSTACK_ENDPOINT')?.toString(),
} 