## Batch processing

This package provides generic tooling for processing batches of data.

The basic usage is as follows:

```js
const { registerProcessor, enqueueItem, processBatch } = useDispatch(
    'core/__experimental-batch-processing'
);

useEffect( () => {
    async function run() {
        // Setup a simple batch processor for "log" queue
        registerProcessor(
            'log',
            // Log strings
            ( inputs ) => {
                console.log( inputs );
                // A processor must return a list of `inputs.length` results – one result per input.  
                return inputs.map( s => 'logged-' + s );
            },
            // Limit transaction size to 2
            () => 2
        );

        // Enqueue "item1" to "item3" in "log" queue and "default" context:
        enqueueItem( 'log', 'default', 'item 1' );
        enqueueItem( 'log', 'default', 'item 2' );
        enqueueItem( 'log', 'default', 'item 3' );

        // Process log/default queue
        const batch = await processBatch( 'log', 'default' );
        // The following output was logged in the console:
        // ["item 1", "item 2"]
        // ["item 3"]
        // This is because processBatch executed two transactions (max size was set to 2), each executing "log" queue procesor:
        console.log( batch.transactions.length );
        // 2
        
        // Each item was assigned a unique id:
        console.log( batch.sortedItemIds );
        // [ "d6cdb799-909c-440a-bd57-9fbe7406aa0f", "e046923c-e340-4c30-89d7-6b6794bff66c", "71acd1d8-ed91-42df-ad1c-c6c1e1117227" ]

        // Results are keyed by these unique ids:
        console.log( batch.results );
        // { 71acd1d8-ed91-42df-ad1c-c6c1e1117227: "logged-item 3", d6cdb799-909c-440a-bd57-9fbe7406aa0f: "logged-item 1", e046923c-e340-4c30-89d7-6b6794bff66c: "logged-item 2"} }

        // Get list of sorted results:
        console.log( batch.sortedItemIds.map( id => batch.results[id] ) )
        // [ "logged-item 1", "logged-item 2", "logged-item 3" ]
    }
    run();
}, [] );
```

Each queue may have multiple "sub-queues" called "contexts":

```js
const { registerProcessor, enqueueItem, processBatch } = useDispatch(
    'core/__experimental-batch-processing'
);

useEffect( () => {
    async function run() {
        // Setup a simple batch processor for "log" queue
        registerProcessor(
            'log',
            // Log strings
            ( inputs ) => {
                console.log( inputs );
                // A processor must return a list of `inputs.length` results – one result per input.  
                return inputs.map( s => 'logged-' + s );
            },
            // Limit transaction size to 2
            () => 2
        );

        // Enqueue "item1" to "item3" in "log" queue and "default" context:
        enqueueItem( 'log', 'default', 'item 1' );
        enqueueItem( 'log', 'default', 'item 2' );
        enqueueItem( 'log', 'default', 'item 3' );

        // Enqueue "item1" to "item3" in "log" queue and "another" context:
        enqueueItem( 'log', 'another', 'item 4' )
        enqueueItem( 'log', 'another', 'item 5' )
        enqueueItem( 'log', 'another', 'item 6' )

        // Process log/default queue
        const batch = await processBatch( 'log', 'default' );
        // ["item 1", "item 2", "item 3"]
        
        // Process log/default queue
        processBatch( 'log', 'another' );
        // ["item 4", "item 5", "item 6"]
    }
    run();
}, [] );
```

Processors may also return promises which is useful for http requests:

```js
registerProcessor(
    'api_fetch',
    ( requests ) => {
        return apiFetch( {
            path: '/v1/batch',
            method: 'POST',
            data: {
                validation: 'require-all-validate',
                requests
            }
        } ).responses.map( ( { body } ) => body );
    },
    () => 10
);
```

If one of the transactions fail, the subsequent ones may choose to short-circuit:

```js
registerProcessor(
    'api_fetch',
    ( requests, batch ) => {
        if ( batch.state === STATE_ERROR ) {
            throw {
                code: 'transaction_failed',
                data: { status: 500 },
                message: 'Transaction failed.',
            };
        }
        // return apiFetch(...)
    },
    () => 10
);

// Later in the code:
const batch = await processBatch( 'api_fetch', 'default' );
console.log( batch.state );
// ERROR

console.log( batch.exception );
// { code: "http_404" }
```

If the transaction fails, the processor may also throw a list of per-input errors: 

```js
registerProcessor(
    'api_fetch',
    async ( requests, batch ) => {
        const response = await apiFetch( /* ... */ );

        if ( response.failed ) {
            // One or more sub-requests failed, let's gather error codes and messages 
            const errors = response.responses.map( ( itemResponse ) => {
                // The REST API returns null if the request did not have an error.
                return itemResponse === null
                    ? {
                            code: 'transaction_failed',
                            data: { status: 400 },
                            message: __(
                                'This item could not be saved because another item encountered an error when trying to save.'
                            ),
                      }
                    : itemResponse.body;
            } );
            // Throw a list of errors
            throw errors;
        }
        
        return response.responses.map( ( { body } ) => body );
    },
    () => 10
);

// Later in the code:
const batch = await processBatch( 'api_fetch', 'default' );
console.log( batch.state );
// ERROR

console.log( batch.sortedItemIds.map( id => batch.errors[id] ) )
// [ { code: 'transaction_failed', /* ... */ }, { code: 'mysql_down', /* ... */ }, ]
```
