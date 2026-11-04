import { createElement } from '@wordpress/element';
import { isInaccessible, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { shortcutAriaLabel } from '@wordpress/keycodes';
import Shortcut from '../shortcut';

describe( 'Shortcut', () => {
	it.each( [ ',', '.', '`' ] )(
		'exposes the readable name of the %s key as text',
		( character ) => {
			render(
				createElement( Shortcut, {
					description: 'Move between blocks',
					keyCombination: { modifier: 'ctrl', character },
				} )
			);

			const label = screen.getByText(
				shortcutAriaLabel.ctrl( character )
			);
			expect( isInaccessible( label ) ).toBe( false );
			expect( isInaccessible( screen.getByText( character ) ) ).toBe(
				true
			);
		}
	);

	it( 'keeps an unmodified character accessible only once', () => {
		render(
			createElement( Shortcut, {
				description: 'Select a block',
				keyCombination: { character: 'H' },
			} )
		);

		const characters = screen.getAllByText( 'H' );
		expect(
			characters.filter( ( element ) => ! isInaccessible( element ) )
		).toHaveLength( 1 );
		expect(
			characters.filter( ( element ) => isInaccessible( element ) )
		).toHaveLength( 1 );
	} );

	it( 'includes every modifier in the accessible text', () => {
		render(
			createElement( Shortcut, {
				description: 'Change the block',
				keyCombination: { modifier: 'ctrlShift', character: 'M' },
			} )
		);

		expect(
			isInaccessible(
				screen.getByText( shortcutAriaLabel.ctrlShift( 'M' ) )
			)
		).toBe( false );
	} );

	it( 'uses a supplied readable label instead of the key symbols', () => {
		render(
			createElement( Shortcut, {
				description: 'Insert a link',
				keyCombination: { character: '[[' },
				ariaLabel: 'Left bracket twice',
			} )
		);

		expect(
			isInaccessible( screen.getByText( 'Left bracket twice' ) )
		).toBe( false );
		expect( isInaccessible( screen.getByText( '[[' ) ) ).toBe( true );
	} );

	it( 'exposes each alternative shortcut without repeating its visual keys', () => {
		render(
			createElement( Shortcut, {
				description: 'Change the block',
				keyCombination: { modifier: 'ctrl', character: ',' },
				aliases: [ { modifier: 'ctrlShift', character: '.' } ],
			} )
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
} );
