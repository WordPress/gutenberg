/**
 * Internal dependencies
 */
import { createQueue } from '../';
import requestIdleCallback from '../request-idle-callback';

jest.mock( '../request-idle-callback', () => {
	const emitter = new ( require.requireActual( 'events' ).EventEmitter )();

	return Object.assign(
		( callback ) => emitter.once( 'tick', () => callback( Date.now() ) ),
		{ tick: () => emitter.emit( 'tick' ) },
	);
} );

describe( 'createQueue', () => {
	let queue;
	beforeEach( () => {
		queue = createQueue();
	} );

	it( 'runs callback after processing waiting queue', () => {
		const callback = jest.fn();
		queue.add( {}, callback );
		expect( callback ).not.toHaveBeenCalled();
		requestIdleCallback.tick();
		expect( callback ).toHaveBeenCalled();
	} );
} );
