/**
 * External dependencies
 */
import { EventEmitter } from 'events';

/**
 * Internal dependencies
 */
import { createQueue } from '../';
import requestIdleCallback from '../request-idle-callback';

const emitter = new EventEmitter();

const tick = () => emitter.emit( 'tick' );

jest.mock( '../request-idle-callback', () => jest.fn() );

requestIdleCallback.mockImplementation( ( callback ) => {
	emitter.once( 'tick', () => callback( Date.now() ) );
} );

describe( 'createQueue', () => {
	let queue;
	beforeEach( () => {
		queue = createQueue();
	} );

	it( 'runs callback after processing waiting queue', () => {
		const callback = jest.fn();
		queue.add( {}, callback );
		tick();
		expect( callback ).toHaveBeenCalled();
	} );
} );
