/**
 * External dependencies
 */

import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import withSpokenMessages from '../';

describe( 'withSpokenMessages', () => {
	it( 'should generate speak and debouncedSpeak props', async () => {
		const testSpeak = jest.fn();
		const testDebouncedSpeak = jest.fn();
		const isFunction = ( maybeFunc: any ) =>
			typeof maybeFunc === 'function';
		const DumpComponent = withSpokenMessages(
			( { speak, debouncedSpeak } ) => {
				testSpeak( isFunction( speak ) );
				testDebouncedSpeak( isFunction( debouncedSpeak ) );
				return <div />;
			}
		);
		await render( <DumpComponent /> );

		// Unrendered element.
		expect( testSpeak ).toHaveBeenCalledWith( true );
		expect( testDebouncedSpeak ).toHaveBeenCalledWith( true );
	} );
} );
