import { getConfigString, getConfigUrl } from '@kl-engineering/config'
import { Client, ClientOptions } from '@elastic/elasticsearch'
import { BulkOperationType, BulkResponseItem, ErrorCause } from '@elastic/elasticsearch/lib/api/types';
import { EventDestination, EventError } from '../eventSender'

export class ElasticSearchEventDestination<Event> implements EventDestination<Event> {
    public constructor(
        private readonly index: string,
        private readonly client = new Client(defaultElasticSearchConfirguration),
    ) {
        this.ping().then(result => {
            if (result) {
                console.log(`Connected to ElasticSearch`)
            } else {
                console.error(`Unable to ping ElasticSearch`)
            }    
        });
    }

    // https://github.com/elastic/elasticsearch-js/blob/main/docs/examples/bulk.asciidoc
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
    public async sendEvents(events: readonly Event[]) {
        try {
            const operations = events.flatMap(e => [{ _index: this.index }, e])
            const { items } = await this.client.bulk({ operations })
            const { errorCount } = filterErrors(items, events);
            if(errorCount > 0) {console.log(`ElasticSearch reported ${errorCount} error(s)`)}
        } catch(e) {
            console.error(e)
        }
    }

    public async ping() {
        try {
            return await this.client.ping()
        } catch(e) {
            console.error(e)
            return false;
        }
    }
}

const filterErrors = <Event>(
    items: Partial<Record<BulkOperationType, BulkResponseItem>>[],
    events: readonly Event[],
) => {
    let missingErrorCount = 0;
    const errors: EventError<Event, ErrorCause>[] = []
    
    items.forEach((item, i) => {
        const error = (item.create ?? item.delete ?? item.index ?? item.update)?.error;
        if(!error) { return; }
        const event = events[i];
        if(!event) { missingErrorCount++; return; }
        errors.push({ error, event });
    })

    const errorCount = errors.length + missingErrorCount
    return {
        errors,
        missingErrorCount,
        errorCount,
    }
};

const defaultElasticSearchConfirguration = function(): ClientOptions {
    const username = getConfigString('ELASTICSEARCH_USERNAME');
    const password = getConfigString('ELASTICSEARCH_PASSWORD');
    return {
        node: getConfigUrl('ELASTICSEARCH_URL')?.toString(),
        auth: username && password ? {
            username,
            password,
        } : undefined,
    };
}();