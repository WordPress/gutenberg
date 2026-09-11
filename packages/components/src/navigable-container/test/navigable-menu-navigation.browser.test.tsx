import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { NavigableMenu } from '../menu';
import type { NavigableMenuProps } from '../types';

const NavigableMenuTestCase = ( props: NavigableMenuProps ) => (
	<NavigableMenu { ...props }>
		<button>Item 1</button>
		<span>
			<span tabIndex={ -1 }>Item 2 (not tabbable)</span>
		</span>
		<p>I can not be focused</p>
		<input type="text" disabled name="disabled-input" />
		<a href="https://example.com">Item 4</a>
	</NavigableMenu>
);

const getNavigableMenuFocusables = () => [
	screen.getByRole( 'button', { name: 'Item 1' } ),
	screen.getByText( 'Item 2 (not tabbable)' ),
	screen.getByRole( 'link', { name: 'Item 4' } ),
];

describe( 'NavigableMenu navigation', () => {
	it( 'moves focus on its focusable children by using the up/down arrow keys', async () => {
		const user = userEvent.setup();
		const onNavigateSpy = vi.fn();
		await render( <NavigableMenuTestCase onNavigate={ onNavigateSpy } /> );

		const focusables = getNavigableMenuFocusables();
		await user.tab();
		expect( focusables[ 0 ] ).toHaveFocus();

		await user.keyboard( '[ArrowDown]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, focusables[ 1 ] );

		await user.keyboard( '[ArrowDown]' );
		expect( focusables[ 2 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 2, focusables[ 2 ] );

		await user.keyboard( '[ArrowUp]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, focusables[ 1 ] );

		await user.keyboard( '[ArrowLeft][ArrowRight]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'moves focus on its focusable children by using the left/right arrow keys when horizontal', async () => {
		const user = userEvent.setup();
		const onNavigateSpy = vi.fn();
		await render(
			<NavigableMenuTestCase
				orientation="horizontal"
				onNavigate={ onNavigateSpy }
			/>
		);

		const focusables = getNavigableMenuFocusables();
		await user.tab();
		expect( focusables[ 0 ] ).toHaveFocus();

		await user.keyboard( '[ArrowRight]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, focusables[ 1 ] );

		await user.keyboard( '[ArrowRight]' );
		expect( focusables[ 2 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 2, focusables[ 2 ] );

		await user.keyboard( '[ArrowLeft]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, focusables[ 1 ] );

		await user.keyboard( '[ArrowUp][ArrowDown]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should stop at the edges when the `cycle` prop is set to `false`', async () => {
		const user = userEvent.setup();
		const onNavigateSpy = vi.fn();
		const { rerender } = await render(
			<NavigableMenuTestCase onNavigate={ onNavigateSpy } />
		);

		const focusables = getNavigableMenuFocusables();
		const firstFocusable = focusables[ 0 ];
		const lastFocusableIndex = focusables.length - 1;
		const lastFocusable = focusables[ lastFocusableIndex ];

		await user.tab();
		expect( firstFocusable ).toHaveFocus();

		await user.keyboard( '[ArrowUp]' );
		expect( lastFocusable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith(
			lastFocusableIndex,
			lastFocusable
		);

		await user.keyboard( '[ArrowDown]' );
		expect( firstFocusable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 0, firstFocusable );

		await rerender(
			<NavigableMenuTestCase
				onNavigate={ onNavigateSpy }
				cycle={ false }
			/>
		);

		await user.keyboard( '[ArrowUp]' );
		expect( firstFocusable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );

		await user.keyboard( '[ArrowDown][ArrowDown]' );
		expect( lastFocusable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith(
			lastFocusableIndex,
			lastFocusable
		);

		await user.keyboard( '[ArrowDown]' );
		expect( lastFocusable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 4 );
	} );
} );
