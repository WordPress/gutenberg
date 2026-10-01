import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Icon } from '../index';

describe( 'Icon', () => {
	it( 'forwards ref', () => {
		const ref = createRef< SVGSVGElement >();

		render( <Icon ref={ ref } icon={ <svg /> } /> );

		expect( ref.current ).toBeInstanceOf( SVGSVGElement );
	} );

	it( "merges consumer styles with the icon's intrinsic styles", () => {
		render(
			<Icon
				icon={ <svg style={ { fill: 'none', opacity: 0.5 } } /> }
				data-testid="test-icon"
				style={ { marginInlineStart: 4, opacity: 1 } }
			/>
		);

		const icon = screen.getByTestId( 'test-icon' );
		// eslint-disable-next-line jest-dom/prefer-to-have-style -- This jsdom test checks normalized inline style values without browser layout.
		expect( icon.style.fill ).toBe( 'none' );
		// eslint-disable-next-line jest-dom/prefer-to-have-style -- This jsdom test checks normalized inline style values without browser layout.
		expect( icon.style.opacity ).toBe( '1' );
		// eslint-disable-next-line jest-dom/prefer-to-have-style -- This jsdom test checks normalized inline style values without browser layout.
		expect( icon.style.marginInlineStart ).toBe( '4px' );
	} );
} );
