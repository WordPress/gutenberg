/**
 * External dependencies
 */
import { setupServer } from 'msw/node';

/**
 * Internal dependencies
 */
import { handlers } from './handlers';

export const server = setupServer( ...handlers );

if ( typeof jest === 'object' ) {
	// Auto run the server when in Jest environment.
	beforeAll( () => server.listen() );
	afterEach( () => server.resetHandlers() );
	afterAll( () => server.close() );
}
