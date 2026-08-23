import { render, screen } from '@testing-library/react';
import { FloatingContainer } from '../floating-container';

/*
 * The untyped .js component's inferred props mark every destructured prop as
 * required; the component itself treats them all as optional.
 */
const AnyFloatingContainer: any = FloatingContainer;

describe( 'FloatingContainer', () => {
	it( 'stays out of the way until the board has placed it', () => {
		// An absolutely positioned card with no `top` falls back to the
		// panel's origin, where every unplaced card lands on top of the one
		// that legitimately sits there and swallows its clicks.
		render(
			<AnyFloatingContainer
				floating={ { y: undefined } }
				data-testid="card"
			/>
		);
		const card = screen.getByTestId( 'card' );
		expect( card ).toHaveStyle( { opacity: '0' } );
		expect( card ).toHaveStyle( { pointerEvents: 'none' } );
	} );

	it( 'is visible and clickable once the board reports a position', () => {
		render(
			<AnyFloatingContainer floating={ { y: 120 } } data-testid="card" />
		);
		const card = screen.getByTestId( 'card' );
		expect( card ).toHaveStyle( { top: '120px' } );
		expect( card ).not.toHaveStyle( { opacity: '0' } );
		expect( card ).not.toHaveStyle( { pointerEvents: 'none' } );
	} );

	it( 'leaves a non-floating card alone', () => {
		render( <AnyFloatingContainer data-testid="card" /> );
		const card = screen.getByTestId( 'card' );
		expect( card ).not.toHaveStyle( { opacity: '0' } );
		expect( card ).not.toHaveClass( 'is-floating' );
	} );
} );
