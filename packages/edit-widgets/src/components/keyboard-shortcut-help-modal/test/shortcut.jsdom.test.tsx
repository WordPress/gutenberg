import { isInaccessible, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { textFormattingShortcuts } from '../config';
import Shortcut from '../shortcut';

describe( 'Shortcut production entries', () => {
	it( 'renders the readable label supplied by the real Insert Link entry', () => {
		const entry = textFormattingShortcuts.find(
			( { keyCombination } ) => keyCombination.character === '[['
		);
		expect( entry ).toBeDefined();

		render( <Shortcut { ...entry! } /> );

		expect(
			isInaccessible( screen.getByText( 'Left bracket twice' ) )
		).toBe( false );
		expect( isInaccessible( screen.getByText( '[[' ) ) ).toBe( true );
		expect(
			screen.getByText( 'Insert a link to a post or page.' )
		).toBeInTheDocument();
	} );
} );
