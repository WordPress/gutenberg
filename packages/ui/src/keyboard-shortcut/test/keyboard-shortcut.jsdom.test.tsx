import { isInaccessible, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createRef } from '@wordpress/element';
import { displayShortcutList, shortcutAriaLabel } from '@wordpress/keycodes';
import { KeyboardShortcut } from '../';

describe( 'KeyboardShortcut', () => {
	it.each( [ ',', '.', '`', '\\', '+', '-' ] )(
		'exposes the readable %s shortcut once and hides its visual keycaps',
		( character ) => {
			render(
				<KeyboardShortcut
					data-testid="shortcut"
					keyCombination={ { modifier: 'ctrl', character } }
				/>
			);

			const label = screen.getByText(
				shortcutAriaLabel.ctrl( character )
			);
			expect( isInaccessible( label ) ).toBe( false );
			const key = screen
				.getAllByText( /./, { selector: 'kbd kbd' } )
				.find( ( element ) => element.textContent === character );
			expect( key ).toBeDefined();
			expect( isInaccessible( key! ) ).toBe( true );
			expect( screen.getByTestId( 'shortcut' ) ).not.toHaveAttribute(
				'aria-label'
			);
		}
	);

	it.each( [
		[ '\\', 'Backslash' ],
		[ '+', 'Plus' ],
		[ '-', 'Minus' ],
	] )(
		'uses the formatter for the standalone %s key',
		( character, label ) => {
			render(
				<KeyboardShortcut
					data-testid="shortcut"
					keyCombination={ { character } }
				/>
			);

			expect( isInaccessible( screen.getByText( label ) ) ).toBe( false );
			const keys = screen.getAllByText( /./, { selector: 'kbd kbd' } );
			expect( keys ).toHaveLength( 1 );
			expect( keys[ 0 ] ).toHaveTextContent( character );
			expect( isInaccessible( keys[ 0 ] ) ).toBe( true );
		}
	);

	it( 'keeps modifier order and a literal Plus keycap distinct from separators', () => {
		render(
			<KeyboardShortcut
				data-testid="shortcut"
				keyCombination={ { modifier: 'ctrlShift', character: '+' } }
			/>
		);

		const parts = displayShortcutList.ctrlShift( '+' );
		const expectedKeys = [
			...parts.slice( 0, -1 ).filter( ( key ) => key !== '+' ),
			'+',
		];
		expect(
			Array.from(
				screen.getAllByText( /./, { selector: 'kbd kbd' } )
			).map( ( key ) => key.textContent )
		).toEqual( expectedKeys );
		expect(
			isInaccessible(
				screen.getByText( shortcutAriaLabel.ctrlShift( '+' ) )
			)
		).toBe( false );
	} );

	it.each( [ undefined, 'shift' ] as const )(
		'exposes a supplied arrow group label with the %s modifier',
		( modifier ) => {
			const arrows = [ '↑', '↓', '←', '→' ];
			const label = modifier ? 'Shift + Arrow keys' : 'Arrow keys';
			const prefix = displayShortcutList[ modifier ?? 'undefined' ](
				arrows[ 0 ]!
			)
				.slice( 0, -1 )
				.filter( ( key ) => key !== '+' );
			render(
				<KeyboardShortcut
					data-testid="shortcut"
					keyCombination={ { modifier, character: arrows } }
					label={ label }
				/>
			);

			expect( isInaccessible( screen.getByText( label ) ) ).toBe( false );
			expect(
				Array.from(
					screen.getAllByText( /./, { selector: 'kbd kbd' } )
				).map( ( key ) => key.textContent )
			).toEqual( [ ...prefix, ...arrows ] );
			for ( const key of screen.getAllByText( /./, {
				selector: 'kbd kbd',
			} ) ) {
				expect( isInaccessible( key ) ).toBe( true );
			}
		}
	);

	it( 'forwards its ref, render element and consumer classes while keeping keys left to right', () => {
		const ref = createRef< HTMLElement >();
		render(
			<div dir="rtl">
				<KeyboardShortcut
					data-testid="shortcut"
					ref={ ref }
					render={ <span data-testid="shortcut" /> }
					className="consumer-shortcut"
					keyClassName="consumer-key"
					keyCombination={ { character: 'H' } }
				/>
			</div>
		);

		expect( ref.current ).toBe( screen.getByTestId( 'shortcut' ) );
		expect( ref.current?.tagName ).toBe( 'SPAN' );
		expect( ref.current ).toHaveAttribute( 'dir', 'ltr' );
		expect( ref.current ).toHaveClass( 'consumer-shortcut' );
		expect( screen.getByText( 'H', { selector: 'kbd' } ) ).toHaveClass(
			'consumer-key'
		);
		expect(
			screen
				.getAllByText( 'H' )
				.filter( ( key ) => ! isInaccessible( key ) )
		).toHaveLength( 1 );
	} );
} );
