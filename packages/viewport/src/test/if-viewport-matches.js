/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import '../store';
import ifViewportMatches from '../if-viewport-matches';

jest.mock( '@wordpress/compose/src/hooks/use-viewport-match' );

describe( 'ifViewportMatches()', () => {
	const Component = () => <div>Hello</div>;

	afterEach( () => {
		useViewportMatch.mockClear();
	} );

	it( 'should not render if query does not match', () => {
		useViewportMatch.mockReturnValueOnce( false );
		const EnhancedComponent = ifViewportMatches( '< wide' )( Component );
		render( <EnhancedComponent /> );

		expect( useViewportMatch ).toHaveBeenCalledWith( 'wide', '<' );

		expect( screen.queryByText( 'Hello' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if query does match', () => {
		useViewportMatch.mockReturnValueOnce( true );
		const EnhancedComponent = ifViewportMatches( '>= wide' )( Component );
		render( <EnhancedComponent /> );

		expect( useViewportMatch ).toHaveBeenCalledWith( 'wide', '>=' );

		expect( screen.getByText( 'Hello' ) ).toBeInTheDocument();
	} );
} );
