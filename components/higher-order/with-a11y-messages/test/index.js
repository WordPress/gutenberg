/**
 * External dependencies
 */
import { render } from 'enzyme';
import { isFunction } from 'lodash';

/**
 * Internal dependencies
 */
import withA11yMessages from '../';

describe( 'withA11yMessages', () => {
	it( 'should generate speak and debouncedSpeak props', () => {
		const testSpeak = jest.fn();
		const testDebouncedSpeak = jest.fn();
		const DumpComponent = withA11yMessages( ( { speak, debouncedSpeak } ) => {
			testSpeak( isFunction( speak ) );
			testDebouncedSpeak( isFunction( debouncedSpeak ) );
			return <div />;
		} );
		render( <DumpComponent /> );

		// Unrendered element.
		expect( testSpeak ).toBeCalledWith( true );
		expect( testDebouncedSpeak ).toBeCalledWith( true );
	} );
} );
