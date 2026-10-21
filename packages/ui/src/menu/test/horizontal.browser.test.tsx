import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { isRTL } from '@wordpress/i18n';
import '@wordpress/theme/design-tokens.css';
import { EmojiMenuExample } from '../stories/emoji-menu';
import { ThemeProvider } from '../../utils/theme-provider';

vi.mock( import( '@wordpress/i18n' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	isRTL: vi.fn( () => false ),
} ) );

const originalDirection = document.documentElement.dir;

function Example() {
	return (
		<ThemeProvider isRoot>
			<EmojiMenuExample />
		</ThemeProvider>
	);
}

afterEach( () => {
	vi.mocked( isRTL ).mockReturnValue( false );
	document.documentElement.dir = originalDirection;
} );

describe( 'Horizontal Menu', () => {
	it.each( [ false, true ] )(
		'lays out the emoji items in navigation order (RTL: %s)',
		async ( rtl ) => {
			vi.mocked( isRTL ).mockReturnValue( rtl );
			document.documentElement.dir = rtl ? 'rtl' : 'ltr';
			await render( <Example /> );
			await userEvent.click(
				screen.getByRole( 'button', { name: 'Add reaction' } )
			);
			await expect.element( page.getByRole( 'menu' ) ).toBeVisible();
			const menu = screen.getByRole( 'menu' );
			expect( menu ).toHaveAttribute( 'aria-orientation', 'horizontal' );
			const items = screen.getAllByRole( 'menuitemcheckbox' );
			expect( items ).toHaveLength( 5 );
			const rects = items.map( ( item ) => item.getBoundingClientRect() );
			for ( let index = 1; index < rects.length; index++ ) {
				expect( rects[ index ].top ).toBeCloseTo( rects[ 0 ].top, 0 );
				expect( rects[ index ].height ).toBeCloseTo(
					rects[ 0 ].height,
					0
				);
				const gap = rtl
					? rects[ index - 1 ].left - rects[ index ].right
					: rects[ index ].left - rects[ index - 1 ].right;
				expect( gap ).toBeGreaterThanOrEqual( 0 );
			}
			// Horizontal mode must remove both the list grid and subgrid items.
			expect( rects[ 0 ].width ).toBeCloseTo( rects[ 0 ].height, 0 );
			expect( menu.getBoundingClientRect().width ).toBeGreaterThan(
				menu.getBoundingClientRect().height
			);
			await userEvent.keyboard( '{Home}' );
			await expect.element( items[ 0 ] ).toHaveFocus();
			await userEvent.keyboard( rtl ? '{ArrowLeft}' : '{ArrowRight}' );
			await expect.element( items[ 1 ] ).toHaveFocus();
		}
	);

	it( 'composes checked state, named emoji typeahead, tooltips, and one-Escape dismissal', async () => {
		await render( <Example /> );
		const trigger = screen.getByRole( 'button', { name: 'Add reaction' } );
		await userEvent.click( trigger );
		await expect.element( page.getByRole( 'menu' ) ).toBeVisible();
		const heart = screen.getByRole( 'menuitemcheckbox', { name: 'Heart' } );
		expect( heart ).toBeChecked();
		await userEvent.keyboard( 'r' );
		const rocket = screen.getByRole( 'menuitemcheckbox', {
			name: 'Rocket',
		} );
		await expect.element( rocket ).toHaveFocus();
		await expect
			.element( page.getByText( 'Rocket', { exact: true } ) )
			.toBeVisible();
		await userEvent.keyboard( '{Enter}' );
		await waitFor( () =>
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
		);
		await expect.element( trigger ).toHaveFocus();
		await userEvent.click( trigger );
		await expect.element( page.getByRole( 'menu' ) ).toBeVisible();
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Rocket' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Heart' } )
		).toBeChecked();
		await userEvent.keyboard( 'h' );
		await expect
			.element( page.getByText( 'Heart', { exact: true } ) )
			.toBeVisible();
		await userEvent.keyboard( '{Escape}' );
		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Heart' ) ).not.toBeInTheDocument();
		} );
		await expect.element( trigger ).toHaveFocus();
	} );
} );
