/**
 * External dependencies
 */
import { render } from 'enzyme';
import { isFunction } from 'lodash';

/**
 * Internal dependencies
 */
import withAssertiveMessages from '../';

describe( 'withAssertiveMessages', () => {
	it( 'should generate speakAssertive and debouncedSpeakAssertive props', () => {
		const testAssertive = jest.fn();
		const testDebouncedAssertive = jest.fn();
		const DumpComponent = withAssertiveMessages( ( { speakAssertive, debouncedSpeakAssertive } ) => {
			testAssertive( isFunction( speakAssertive ) );
			testDebouncedAssertive( isFunction( debouncedSpeakAssertive ) );
			return <div />;
		} );
		render( <DumpComponent /> );

		// Unrendered element.
		expect( testAssertive ).toBeCalledWith( true );
		expect( testDebouncedAssertive ).toBeCalledWith( true );
	} );
} );
