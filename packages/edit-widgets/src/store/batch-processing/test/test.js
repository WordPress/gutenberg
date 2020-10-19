/**
 * Internal dependencies
 */
import store from '../index';
import {
	registerProcessor,
	enqueueItemAndWaitForResults,
	processBatch,
} from '../actions';
import { STATE_ERROR, STATE_SUCCESS } from '../constants';

const TEST_QUEUE = 'TEST_QUEUE';
const TEST_CONTEXT = 'default';

async function processor( requests, transaction ) {
	if ( transaction.state === STATE_ERROR ) {
		throw {
			code: 'transaction_failed',
			data: { status: 500 },
			message: 'Transaction failed.',
		};
	}

	return await Promise.resolve(
		requests.map( ( request ) => ( {
			done: true,
			name: request.name,
		} ) )
	);
}

async function testItem( name ) {
	const item = { name };
	const { wait } = await store.dispatch(
		enqueueItemAndWaitForResults( TEST_QUEUE, TEST_CONTEXT, item )
	);

	const expected = { done: true, name };

	// We can't await this until the batch is processed.
	// eslint-disable-next-line jest/valid-expect
	const promise = expect( wait ).resolves.toEqual( expected );

	return { expected, promise };
}

describe( 'waitForResults', function () {
	store.dispatch( registerProcessor( TEST_QUEUE, processor ) );

	it( 'works', async () => {
		expect.assertions( 4 );

		const { expected: i1, promise: p1 } = await testItem( 'i1' );
		const { expected: i2, promise: p2 } = await testItem( 'i2' );

		const resolves = [ p1, p2 ];
		const batch = await store.dispatch(
			processBatch( TEST_QUEUE, TEST_CONTEXT )
		);

		expect( batch.state ).toEqual( STATE_SUCCESS );
		expect( Object.values( batch.results ) ).toEqual( [ i1, i2 ] );

		await Promise.all( resolves );
	} );

	it( 'can use the same context more than once', async () => {
		expect.assertions( 4 );

		const { promise: p1 } = await testItem( 'i1' );
		await store.dispatch( processBatch( TEST_QUEUE, TEST_CONTEXT ) );
		await p1;

		const { expected: i2, promise: p2 } = await testItem( 'i2' );
		const batch = await store.dispatch(
			processBatch( TEST_QUEUE, TEST_CONTEXT )
		);

		expect( batch.state ).toEqual( STATE_SUCCESS );
		expect( Object.values( batch.results ) ).toEqual( [ i2 ] );
		await p2;
	} );
} );
