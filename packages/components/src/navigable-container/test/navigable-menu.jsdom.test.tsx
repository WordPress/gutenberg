import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe( 'NavigableMenu', () => {
	it( 'stops keydown event propagation when arrow keys are pressed, regardless of the `orientation` prop', async () => {
		const user = userEvent.setup();
		const externalWrapperOnKeyDownSpy = vi.fn();

		render(
			// Disable reason: this is only for test purposes.
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onKeyDown={ externalWrapperOnKeyDownSpy }>
				<NavigableMenuTestCase />
			</div>
		);

		const focusables = getNavigableMenuFocusables();
		await user.tab();
		expect( focusables[ 0 ] ).toHaveFocus();

		await user.keyboard( '[Space]' );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 1 );

		await user.keyboard( '[ArrowDown][ArrowUp][ArrowLeft][ArrowRight]' );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 1 );

		await user.keyboard( '[Escape]' );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should keep forwarded callback refs stable across rerenders', () => {
		const refSpy = vi.fn();
		const { rerender } = render(
			<NavigableMenu ref={ refSpy }>
				<button>Item 1</button>
			</NavigableMenu>
		);

		expect( refSpy ).toHaveBeenCalledTimes( 1 );
		expect( refSpy ).toHaveBeenCalledWith( expect.any( HTMLElement ) );

		rerender(
			<NavigableMenu ref={ refSpy }>
				<button>Item 1</button>
			</NavigableMenu>
		);

		expect( refSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'skips its internal logic when the tab key is pressed', async () => {
		const user = userEvent.setup();
		render(
			<>
				<button>Before menu</button>
				<NavigableMenuTestCase />
				<button>After menu</button>
			</>
		);

		const beforeFocusable = screen.getByRole( 'button', {
			name: 'Before menu',
		} );
		const internalFocusables = getNavigableMenuFocusables();
		const firstFocusable = internalFocusables[ 0 ];
		const lastFocusable =
			internalFocusables[ internalFocusables.length - 1 ];
		const afterFocusable = screen.getByRole( 'button', {
			name: 'After menu',
		} );

		await user.tab();
		expect( beforeFocusable ).toHaveFocus();
		await user.tab();
		expect( firstFocusable ).toHaveFocus();
		await user.tab();
		expect( lastFocusable ).toHaveFocus();
		await user.tab();
		expect( afterFocusable ).toHaveFocus();
		await user.tab( { shift: true } );
		expect( lastFocusable ).toHaveFocus();
		await user.tab( { shift: true } );
		expect( firstFocusable ).toHaveFocus();
		await user.tab( { shift: true } );
		expect( beforeFocusable ).toHaveFocus();
	} );
} );
