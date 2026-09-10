import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useViewportMatch } from '@wordpress/compose';
import '../store';
import ifViewportMatches from '../if-viewport-matches';

vi.mock( import( '../../../compose/src/hooks/use-viewport-match' ), () => ( {
	default: vi.fn(),
} ) );

const mockedUseViewportMatch = vi.mocked( useViewportMatch );

describe( 'ifViewportMatches()', () => {
	const Component = () => <div>Hello</div>;

	afterEach( () => {
		mockedUseViewportMatch.mockClear();
	} );

	it( 'should not render if query does not match', () => {
		mockedUseViewportMatch.mockReturnValueOnce( false );
		const EnhancedComponent = ifViewportMatches( '< wide' )( Component );
		render( <EnhancedComponent /> );

		expect( useViewportMatch ).toHaveBeenCalledWith( 'wide', '<' );

		expect( screen.queryByText( 'Hello' ) ).not.toBeInTheDocument();
	} );

	it( 'should render if query does match', () => {
		mockedUseViewportMatch.mockReturnValueOnce( true );
		const EnhancedComponent = ifViewportMatches( '>= wide' )( Component );
		render( <EnhancedComponent /> );

		expect( useViewportMatch ).toHaveBeenCalledWith( 'wide', '>=' );

		expect( screen.getByText( 'Hello' ) ).toBeInTheDocument();
	} );
} );
