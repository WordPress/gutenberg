import { isInaccessible, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MediaEditorKeyboardShortcutsModal from '../';

describe( 'MediaEditorKeyboardShortcutsModal', () => {
	it.each( [
		[ 'Zoom in', 'Plus', '+' ],
		[ 'Zoom out', 'Minus', '-' ],
	] )(
		'exposes the readable key name in the real %s entry',
		( description, label, key ) => {
			render( <MediaEditorKeyboardShortcutsModal onClose={ vi.fn() } /> );
			const row = screen
				.getAllByRole( 'listitem' )
				.find( ( item ) => within( item ).queryByText( description ) )!;

			expect( isInaccessible( within( row ).getByText( label ) ) ).toBe(
				false
			);
			expect( isInaccessible( within( row ).getByText( key ) ) ).toBe(
				true
			);
			for ( const keycap of within( row ).getAllByText( /./, {
				selector: 'kbd',
			} ) ) {
				expect( keycap ).not.toHaveAttribute( 'aria-label' );
			}
		}
	);

	it.each( [
		[ 'Pan', 'Arrow keys' ],
		[ 'Pan or resize crop (large step)', 'Shift + Arrow keys' ],
	] )(
		'renders the real %s group label as text and hides its arrow keycaps',
		( description, label ) => {
			render( <MediaEditorKeyboardShortcutsModal onClose={ vi.fn() } /> );
			const row = screen
				.getAllByRole( 'listitem' )
				.find( ( item ) => within( item ).queryByText( description ) )!;

			expect( isInaccessible( within( row ).getByText( label ) ) ).toBe(
				false
			);
			for ( const arrow of [ '↑', '↓', '←', '→' ] ) {
				expect(
					isInaccessible( within( row ).getByText( arrow ) )
				).toBe( true );
			}
		}
	);
} );
