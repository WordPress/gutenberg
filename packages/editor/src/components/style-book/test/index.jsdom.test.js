import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement, forwardRef } from '@wordpress/element';
import { StyleBookBody } from '../';

vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

// JSDOM cannot load the iframe's blob document. Test the button-mode keyboard
// handlers here; native iframe focus navigation is covered by the e2e tests.
vi.mock( '@wordpress/block-editor/src/components/iframe', () => ( {
	default: forwardRef( ( { role, tabIndex, onKeyDown, onClick }, ref ) =>
		createElement( 'iframe', { role, tabIndex, onKeyDown, onClick, ref } )
	),
} ) );

describe( 'StyleBookBody', () => {
	it.each( [
		[ 'Enter', 13 ],
		[ 'Space', 32 ],
	] )( 'activates button previews with %s', ( name, keyCode ) => {
		const onClick = vi.fn();
		render(
			createElement( StyleBookBody, {
				onClick,
				settings: { styles: [] },
			} )
		);
		const preview = screen.getByRole( 'button' );
		expect( preview ).toHaveAttribute( 'tabindex', '0' );
		fireEvent.keyDown( preview, {
			key: name === 'Space' ? ' ' : name,
			keyCode,
		} );
		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );
} );
