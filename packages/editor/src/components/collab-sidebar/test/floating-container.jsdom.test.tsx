/*
 * The card's placement is carried by inline styles the component sets, so
 * this reads `element.style` directly: `toHaveStyle` computes styles, which
 * the unit test conventions reserve for Browser Mode.
 */
/* eslint-disable jest-dom/prefer-to-have-style */
import { describe, expect, it } from 'vitest';
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
		expect( card.style.opacity ).toBe( '0' );
		expect( card.style.pointerEvents ).toBe( 'none' );
	} );

	it( 'is visible and clickable once the board reports a position', () => {
		render(
			<AnyFloatingContainer floating={ { y: 120 } } data-testid="card" />
		);
		const card = screen.getByTestId( 'card' );
		expect( card.style.top ).toBe( '120px' );
		expect( card.style.opacity ).not.toBe( '0' );
		expect( card.style.pointerEvents ).not.toBe( 'none' );
	} );

	it( 'leaves a non-floating card alone', () => {
		render( <AnyFloatingContainer data-testid="card" /> );
		const card = screen.getByTestId( 'card' );
		expect( card.style.opacity ).not.toBe( '0' );
		expect( card ).not.toHaveClass( 'is-floating' );
	} );
} );
/* eslint-enable jest-dom/prefer-to-have-style */
