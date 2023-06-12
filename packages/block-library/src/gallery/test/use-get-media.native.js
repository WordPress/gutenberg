/**
 * External dependencies
 */
import { render } from 'test/helpers';

/**
 * Internal dependencies
 */
import useGetMedia from '../use-get-media';

describe( 'useGetMedia', () => {
	// TODO: Explore why a Gallery block would ever be without inner blocks.
	// This test and the associated default function parameter might be unnecessary.
	it( 'should not error when receiving zero images', () => {
		// Arrange
		const TestSubject = () => {
			useGetMedia( undefined );
			return null;
		};

		// Assert
		expect( () => render( <TestSubject /> ) ).not.toThrow();
	} );
} );
