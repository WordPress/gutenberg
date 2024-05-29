/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
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

const originalGetClientRects = window.HTMLElement.prototype.getClientRects;

describe( 'TabbableContainer', () => {
	beforeAll( () => {
		// Mocking `getClientRects()` is necessary to pass a check performed by
		// the `focus.tabbable.find()` and by the `focus.focusable.find()` functions
		// from the `@wordpress/dom` package.
		// @ts-expect-error We're not trying to comply to the DOM spec, only mocking
		window.HTMLElement.prototype.getClientRects = function () {
			return [ 'trick-jsdom-into-having-size-for-element-rect' ];
		};
	} );

	afterAll( () => {
		window.HTMLElement.prototype.getClientRects = originalGetClientRects;
	} );

	it( 'moves focus on its tabbable children by using the tab key', async () => {
		const user = userEvent.setup();

		const onNavigateSpy = jest.fn();

		render( <TabbableContainerTestCase onNavigate={ onNavigateSpy } /> );

		const tabbables = getTabbableContainerTabbables();

		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Before container' } )
		).toHaveFocus();

		await user.tab();
		expect( tabbables[ 0 ] ).toHaveFocus();

		await user.tab();
		expect( tabbables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 1 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, tabbables[ 1 ] );

		await user.tab();
		expect( tabbables[ 2 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 2, tabbables[ 2 ] );

		await user.tab( { shift: true } );
		expect( tabbables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, tabbables[ 1 ] );
	} );

	it( 'should stop at the edges when the `cycle` prop is set to `false`', async () => {
		const user = userEvent.setup();

		const onNavigateSpy = jest.fn();

		const { rerender } = render(
			<TabbableContainerTestCase onNavigate={ onNavigateSpy } />
		);

		const tabbables = getTabbableContainerTabbables();
		const firstTabbable = tabbables[ 0 ];
		const lastTabbableIndex = tabbables.length - 1;
		const lastTabbable = tabbables[ lastTabbableIndex ];

		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'Before container' } )
		).toHaveFocus();

		await user.tab();
		expect( firstTabbable ).toHaveFocus();

		// By default, cycling from first to last and from last to first is allowed.
		await user.tab( { shift: true } );
		expect( lastTabbable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 1 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith(
			lastTabbableIndex,
			lastTabbable
		);

		await user.tab();
		expect( firstTabbable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 0, firstTabbable );

		rerender(
			<TabbableContainerTestCase
				onNavigate={ onNavigateSpy }
				cycle={ false }
			/>
		);

		// By default, cycling from first to last and from last to first is allowed.
		// With the `cycle` prop set to `false`, cycling is not allowed.
		// Therefore, focus will escape the `TabbableContainer` and continue its
		// natural path in the page.
		await user.tab( { shift: true } );
		expect(
			screen.getByRole( 'button', { name: 'Before container' } )
		).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );

		await user.tab();
		await user.tab();
		await user.tab();
		expect( lastTabbable ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 4 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith(
			lastTabbableIndex,
			lastTabbable
		);

		// Focus will move to the next natively focusable elements after
		// `TabbableContainer`
		await user.tab();
		expect(
			screen.getByRole( 'button', { name: 'After container' } )
		).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 4 );
	} );

	it( 'stops keydown event propagation when the tab key is pressed', async () => {
		const user = userEvent.setup();

		const externalWrapperOnKeyDownSpy = jest.fn();

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
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 0 );

		await user.tab();
		expect( tabbables[ 0 ] ).toHaveFocus();
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 1 );

		await user.keyboard( '[Space]' );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 2 );

		await user.tab();
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 2 );
		await user.tab( { shift: true } );
		// This extra call is caused by the "shift" key being pressed
		// on its own before "tab"
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 3 );

		await user.keyboard( '[Escape]' );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 4 );
	} );
} );
