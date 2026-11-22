import { isInaccessible, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { shortcutAriaLabel } from '@wordpress/keycodes';
import { textFormattingShortcuts } from '../config';
import Shortcut from '../shortcut';

describe( 'Shortcut production entries', () => {
	it( 'renders each alternative shortcut through the shared display', () => {
		render(
			<Shortcut
				description="Change the block"
				keyCombination={ { modifier: 'ctrl', character: ',' } }
				aliases={ [ { modifier: 'ctrlShift', character: '.' } ] }
			/>
		);

		for ( const label of [
			shortcutAriaLabel.ctrl( ',' ),
			shortcutAriaLabel.ctrlShift( '.' ),
		] ) {
			expect( isInaccessible( screen.getByText( label ) ) ).toBe( false );
		}
		expect( isInaccessible( screen.getByText( ',' ) ) ).toBe( true );
		expect( isInaccessible( screen.getByText( '.' ) ) ).toBe( true );
	} );

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
