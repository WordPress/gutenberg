import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { TabbableContainer } from '../tabbable';
import type { TabbableContainerProps } from '../types';

const TabbableContainerTestCase = ( props: TabbableContainerProps ) => (
	<>
		<button>Before container</button>
		<TabbableContainer { ...props }>
			<button>Item 1</button>
			<span>
				<span tabIndex={ -1 }>Item 2 (not tabbable)</span>
			</span>
			<span>
				<span tabIndex={ 0 }>Item 3</span>
			</span>
			<p>I can not be tabbed</p>
			<input type="text" disabled name="disabled-input" />
			<a href="https://example.com">Item 4</a>
		</TabbableContainer>
		<button>After container</button>
	</>
);

const getTabbableContainerTabbables = () => [
	screen.getByRole( 'button', { name: 'Item 1' } ),
	screen.getByText( 'Item 3' ),
	screen.getByRole( 'link', { name: 'Item 4' } ),
];

describe( 'TabbableContainer navigation', () => {
	it( 'moves focus on its tabbable children by using the tab key', async () => {
		const user = userEvent.setup();
		const onNavigateSpy = vi.fn();
		await render(
			<TabbableContainerTestCase onNavigate={ onNavigateSpy } />
		);

		const tabbables = getTabbableContainerTabbables();
		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Before container' } )
		).toHaveFocus();

		await user.tab();
		expect( tabbables[ 0 ] ).toHaveFocus();

		await user.tab();
		expect( tabbables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, tabbables[ 1 ] );

		await user.tab();
		expect( tabbables[ 2 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 2, tabbables[ 2 ] );

		await user.tab( { shift: true } );
		expect( tabbables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, tabbables[ 1 ] );
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should stop at the edges when the `cycle` prop is set to `false`', async () => {
		const user = userEvent.setup();
		const onNavigateSpy = vi.fn();
		const { rerender } = await render(
			<TabbableContainerTestCase onNavigate={ onNavigateSpy } />
		);

		const tabbables = getTabbableContainerTabbables();
		const firstTabbable = tabbables[ 0 ];
		const lastTabbableIndex = tabbables.length - 1;
		const lastTabbable = tabbables[ lastTabbableIndex ];

		await user.tab();
		await user.tab();
		expect( firstTabbable ).toHaveFocus();

		await user.tab( { shift: true } );
		expect( lastTabbable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith(
			lastTabbableIndex,
			lastTabbable
		);

		await user.tab();
		expect( firstTabbable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 0, firstTabbable );

		await rerender(
			<TabbableContainerTestCase
				onNavigate={ onNavigateSpy }
				cycle={ false }
			/>
		);

		await user.tab( { shift: true } );
		expect(
			screen.getByRole( 'button', { name: 'Before container' } )
		).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );

		await user.tab();
		await user.tab();
		await user.tab();
		expect( lastTabbable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenLastCalledWith(
			lastTabbableIndex,
			lastTabbable
		);

		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'After container' } )
		).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 4 );
	} );
} );
