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
import withViewportMatch from '../with-viewport-match';

jest.mock( '@wordpress/compose/src/hooks/use-viewport-match' );

const Component = ( { isWide, isSmall, isLarge, isLessThanSmall } ) => {
	return (
		<div>
			<span>{ isWide && 'Is wide' }</span>
			<span>{ isSmall && 'Is small' }</span>
			<span>{ isLarge && 'Is large' }</span>
			<span>{ isLessThanSmall && 'Is less than small' }</span>
		</div>
	);
};

describe( 'withViewportMatch()', () => {
	afterEach( () => {
		useViewportMatch.mockClear();
	} );

	it( 'should render with result of query as custom prop name', () => {
		const EnhancedComponent = withViewportMatch( {
			isWide: '>= wide',
			isSmall: '>= small',
			isLarge: 'large',
			isLessThanSmall: '< small',
		} )( Component );

		useViewportMatch.mockReturnValueOnce( false );
		useViewportMatch.mockReturnValueOnce( true );
		useViewportMatch.mockReturnValueOnce( true );
		useViewportMatch.mockReturnValueOnce( false );

		render( <EnhancedComponent /> );

		expect( useViewportMatch.mock.calls ).toEqual( [
			[ 'wide', '>=' ],
			[ 'small', '>=' ],
			[ 'large', '>=' ],
			[ 'small', '<' ],
		] );

		expect( screen.getByText( 'Is small' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Is large' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Is wide' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Is less than small' )
		).not.toBeInTheDocument();
	} );
} );
