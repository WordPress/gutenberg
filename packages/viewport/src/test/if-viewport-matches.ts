/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import '../store';
import ifViewportMatches from '../if-viewport-matches';

jest.mock( '@wordpress/compose/src/hooks/use-viewport-match' );

const mockedUseViewportMatch = useViewportMatch as jest.MockedFunction<
	typeof useViewportMatch
>;

describe( 'ifViewportMatches()', () => {
	const Component = () => createElement( 'div', {}, 'Hello' );

	afterEach( () => {
		mockedUseViewportMatch.mockClear();
	} );

	it( 'should not render if query does not match', () => {
		mockedUseViewportMatch.mockReturnValueOnce( false );
		const EnhancedComponent = ifViewportMatches( '< wide' )( Component );
		render( createElement( EnhancedComponent ) );

		expect( useViewportMatch ).toHaveBeenCalledWith( 'wide', '<' );

		expect( screen.queryByText( 'Hello' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if query does match', () => {
		mockedUseViewportMatch.mockReturnValueOnce( true );
		const EnhancedComponent = ifViewportMatches( '>= wide' )( Component );
		render( createElement( EnhancedComponent ) );

		expect( useViewportMatch ).toHaveBeenCalledWith( 'wide', '>=' );

		expect( screen.getByText( 'Hello' ) ).toBeInTheDocument();
	} );
} );
