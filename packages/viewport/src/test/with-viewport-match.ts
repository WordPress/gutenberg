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
import withViewportMatch from '../with-viewport-match';

jest.mock( '@wordpress/compose/src/hooks/use-viewport-match' );

interface ComponentProps {
	isWide?: boolean;
	isSmall?: boolean;
	isLarge?: boolean;
	isLessThanSmall?: boolean;
}

const Component = ( {
	isWide,
	isSmall,
	isLarge,
	isLessThanSmall,
}: ComponentProps ) => {
	return createElement(
		'div',
		{},
		createElement( 'span', {}, isWide && 'Is wide' ),
		createElement( 'span', {}, isSmall && 'Is small' ),
		createElement( 'span', {}, isLarge && 'Is large' ),
		createElement( 'span', {}, isLessThanSmall && 'Is less than small' )
	);
};

const mockedUseViewportMatch = useViewportMatch as jest.MockedFunction<
	typeof useViewportMatch
>;

describe( 'withViewportMatch()', () => {
	afterEach( () => {
		mockedUseViewportMatch.mockClear();
	} );

	it( 'should render with result of query as custom prop name', () => {
		const EnhancedComponent = withViewportMatch( {
			isWide: '>= wide',
			isSmall: '>= small',
			isLarge: 'large',
			isLessThanSmall: '< small',
		} )( Component );

		mockedUseViewportMatch.mockReturnValueOnce( false );
		mockedUseViewportMatch.mockReturnValueOnce( true );
		mockedUseViewportMatch.mockReturnValueOnce( true );
		mockedUseViewportMatch.mockReturnValueOnce( false );

		render( createElement( EnhancedComponent ) );

		expect( useViewportMatch ).toHaveBeenCalledTimes( 4 );
		expect( mockedUseViewportMatch.mock.calls ).toEqual( [
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
