import { isInaccessible, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { textFormattingShortcuts } from '../config';
import Shortcut from '../shortcut';

describe( 'Shortcut production entries', () => {
	it( 'keeps null modifiers readable for the primary shortcut and aliases', () => {
		render(
			<Shortcut
				description="Unmodified punctuation"
				keyCombination={ { modifier: null, character: '\\' } }
				aliases={ [ { modifier: null, character: '+' } ] }
			/>
		);

		for ( const label of [ 'Backslash', 'Plus' ] ) {
			expect( isInaccessible( screen.getByText( label ) ) ).toBe( false );
		}
		for ( const key of [ '\\', '+' ] ) {
			expect(
				isInaccessible(
					screen.getByText( key, { selector: 'kbd kbd' } )
				)
			).toBe( true );
		}
	} );

	it.each( [
		[ 'escape', 'Escape' ],
		[ 'del', 'Del' ],
		[ 'backspace', 'Backspace' ],
	] )(
		'keeps the formatter capitalization for the standalone %s key',
		( character, expected ) => {
			render(
				<Shortcut
					description="Unmodified key"
					keyCombination={ { character } }
				/>
			);

			const label = screen
				.getAllByText( expected )
				.find( ( element ) => ! isInaccessible( element ) )!;
			const key = screen.getByText( expected, { selector: 'kbd kbd' } );
			expect( isInaccessible( label ) ).toBe( false );
			expect( isInaccessible( key ) ).toBe( true );
		}
	);
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
