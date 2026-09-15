import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe( 'TabbableContainer', () => {
	it( 'stops keydown event propagation when the tab key is pressed', async () => {
		const user = userEvent.setup();
		const externalWrapperOnKeyDownSpy = vi.fn();

		render(
			// Disable reason: this is only for test purposes.
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div onKeyDown={ externalWrapperOnKeyDownSpy }>
				<TabbableContainerTestCase />
			</div>
		);

		const tabbables = getTabbableContainerTabbables();
		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Before container' } )
		).toHaveFocus();
		expect( externalWrapperOnKeyDownSpy ).not.toHaveBeenCalled();

		await user.tab();
		expect( tabbables[ 0 ] ).toHaveFocus();
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 1 );

		await user.keyboard( '[Space]' );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 2 );

		await user.tab();
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 2 );
		await user.tab( { shift: true } );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 3 );

		await user.keyboard( '[Escape]' );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 4 );
	} );
} );
