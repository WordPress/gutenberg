import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useViewportMatch } from '@wordpress/compose';
import '../store';
import withViewportMatch from '../with-viewport-match';

vi.mock( import( '../../../compose/src/hooks/use-viewport-match' ), () => ( {
	default: vi.fn(),
} ) );

const mockedUseViewportMatch = vi.mocked( useViewportMatch );

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

		render( <EnhancedComponent /> );

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
