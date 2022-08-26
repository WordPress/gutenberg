/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { NavigableMenu } from '../menu';
import { TabbableContainer } from '../tabbable';

const NavigableMenuTestCase = ( props ) => (
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

const TabbableContainerTestCase = ( props ) => (
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
);

const getNavigableMenuFocusables = () => [
	screen.getByRole( 'button', { name: 'Item 1' } ),
	screen.getByText( 'Item 2 (not tabbable)' ),
	screen.getByRole( 'link', { name: 'Item 4' } ),
];

const getTabbableContainerTabbables = () => [
	screen.getByRole( 'button', { name: 'Item 1' } ),
	screen.getByText( 'Item 3' ),
	screen.getByRole( 'link', { name: 'Item 4' } ),
];

const originalGetClientRects = window.HTMLElement.prototype.getClientRects;

describe( 'NavigableMenu and TabbableContainer', () => {
	beforeAll( () => {
		window.HTMLElement.prototype.getClientRects = function () {
			return [ 'trick-jsdom-into-having-size-for-element-rect' ];
		};
	} );

	afterAll( () => {
		window.HTMLElement.prototype.getClientRects = originalGetClientRects;
	} );

	describe( 'NavigableMenu', () => {
		it( 'moves focus on its focusable children by using the up/down arrow keys', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const onNavigateSpy = jest.fn();

			render( <NavigableMenuTestCase onNavigate={ onNavigateSpy } /> );

			const focusables = getNavigableMenuFocusables();

			// Move focus to first item.
			await user.tab();
			expect( focusables[ 0 ] ).toHaveFocus();

			// By default, up/down arrows are used to navigate.
			await user.keyboard( '[ArrowDown]' );
			expect( focusables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 1 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				1,
				focusables[ 1 ]
			);

			await user.keyboard( '[ArrowDown]' );
			expect( focusables[ 2 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				2,
				focusables[ 2 ]
			);

			await user.keyboard( '[ArrowUp]' );
			expect( focusables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				1,
				focusables[ 1 ]
			);

			// Left/right arrows don't navigate.
			await user.keyboard( '[ArrowLeft]' );
			expect( focusables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );

			await user.keyboard( '[ArrowRight]' );
			expect( focusables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'moves focus on its focusable children by using the left/right arrow keys when the `orientation`prop is set to `horizontal', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const onNavigateSpy = jest.fn();

			render(
				<NavigableMenuTestCase
					orientation="horizontal"
					onNavigate={ onNavigateSpy }
				/>
			);

			const focusables = getNavigableMenuFocusables();

			// Move focus to first item.
			await user.tab();
			expect( focusables[ 0 ] ).toHaveFocus();

			// When `orientation="horizontal"`, left/right arrows are used to navigate.
			await user.keyboard( '[ArrowRight]' );
			expect( focusables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 1 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				1,
				focusables[ 1 ]
			);

			await user.keyboard( '[ArrowRight]' );
			expect( focusables[ 2 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				2,
				focusables[ 2 ]
			);

			await user.keyboard( '[ArrowLeft]' );
			expect( focusables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				1,
				focusables[ 1 ]
			);

			// When `orientation="horizontal"`, up/down arrows don't navigate.
			await user.keyboard( '[ArrowUp]' );
			expect( focusables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );

			await user.keyboard( '[ArrowDown]' );
			expect( focusables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'should stop at the edges when the `cycle` prop is set to `false`', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const onNavigateSpy = jest.fn();

			const { rerender } = render(
				<NavigableMenuTestCase onNavigate={ onNavigateSpy } />
			);

			const focusables = getNavigableMenuFocusables();
			const firstFocusable = focusables[ 0 ];
			const lastFocusableIndex = focusables.length - 1;
			const lastFocusable = focusables[ lastFocusableIndex ];

			// Move focus to first item.
			await user.tab();
			expect( firstFocusable ).toHaveFocus();

			// By default, cycling from first to last and from last to first is allowed.
			await user.keyboard( '[ArrowUp]' );
			expect( lastFocusable ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 1 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				lastFocusableIndex,
				lastFocusable
			);

			await user.keyboard( '[ArrowDown]' );
			expect( firstFocusable ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				0,
				firstFocusable
			);

			rerender(
				<NavigableMenuTestCase
					onNavigate={ onNavigateSpy }
					cycle={ false }
				/>
			);

			// With the `cycle` prop set to `false`, cycling is not allowed.
			// By default, cycling from first to last and from last to first is allowed.
			await user.keyboard( '[ArrowUp]' );
			expect( firstFocusable ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );

			await user.keyboard( '[ArrowDown][ArrowDown]' );
			expect( lastFocusable ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 4 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				lastFocusableIndex,
				lastFocusable
			);

			await user.keyboard( '[ArrowDown]' );
			expect( lastFocusable ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 4 );
		} );

		it( 'stops keydown event propagation when arrow keys are pressed, regardless of the `orientation` prop', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const externalWrapperOnKeyDownSpy = jest.fn();

			render(
				// Disable reason: this is only for test purposes.
				// eslint-disable-next-line jsx-a11y/no-static-element-interactions
				<div onKeyDown={ externalWrapperOnKeyDownSpy }>
					<NavigableMenuTestCase />
				</div>
			);

			const focusables = getNavigableMenuFocusables();

			// Move focus to first item
			await user.tab();
			expect( focusables[ 0 ] ).toHaveFocus();

			await user.keyboard( '[Space]' );
			expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 1 );

			await user.keyboard(
				'[ArrowDown][ArrowUp][ArrowLeft][ArrowRight]'
			);
			expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 1 );

			await user.keyboard( '[Escape]' );
			expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'skips its internal logic when the tab key is pressed', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

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
			const lastFocusableIndex = internalFocusables.length - 1;
			const lastFocusable = internalFocusables[ lastFocusableIndex ];
			const afterFocusable = screen.getByRole( 'button', {
				name: 'After menu',
			} );

			// The 'tab' key is not handled by the component, which means that elements
			// are focused following the standard browser behavior.
			await user.tab();
			expect( beforeFocusable ).toHaveFocus();

			await user.tab();
			expect( firstFocusable ).toHaveFocus();

			// Note: the second element "internalFocusables" is not focused by default
			// by the browser because it has `tabindex="-1"`

			await user.tab();
			expect( lastFocusable ).toHaveFocus();

			await user.tab();
			expect( afterFocusable ).toHaveFocus();

			await user.tab( { shift: true } );
			expect( lastFocusable ).toHaveFocus();

			// Note: the second element "internalFocusables" is not focused by default
			// by the browser because it has `tabindex="-1"`

			await user.tab( { shift: true } );
			expect( firstFocusable ).toHaveFocus();

			await user.tab( { shift: true } );
			expect( beforeFocusable ).toHaveFocus();
		} );
	} );

	describe( 'TabbableContainer', () => {
		it( 'moves focus on its tabbable children by using the tab key', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const onNavigateSpy = jest.fn();

			render(
				<TabbableContainerTestCase onNavigate={ onNavigateSpy } />
			);

			const tabbables = getTabbableContainerTabbables();

			// Move focus to first item.
			await user.tab();
			expect( tabbables[ 0 ] ).toHaveFocus();

			await user.tab();
			expect( tabbables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 1 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				1,
				tabbables[ 1 ]
			);

			await user.tab();
			expect( tabbables[ 2 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				2,
				tabbables[ 2 ]
			);

			await user.tab( { shift: true } );
			expect( tabbables[ 1 ] ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				1,
				tabbables[ 1 ]
			);
		} );

		it( 'should stop at the edges when the `cycle` prop is set to `false`', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const onNavigateSpy = jest.fn();

			const { rerender } = render(
				<TabbableContainerTestCase onNavigate={ onNavigateSpy } />
			);

			const tabbables = getTabbableContainerTabbables();
			const firstTabbable = tabbables[ 0 ];
			const lastTabbableIndex = tabbables.length - 1;
			const lastTabbable = tabbables[ lastTabbableIndex ];

			// Move focus to first item.
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
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				0,
				firstTabbable
			);

			rerender(
				<TabbableContainerTestCase
					onNavigate={ onNavigateSpy }
					cycle={ false }
				/>
			);

			// With the `cycle` prop set to `false`, cycling is not allowed.
			// By default, cycling from first to last and from last to first is allowed.
			await user.tab( { shift: true } );
			expect( firstTabbable ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );

			await user.tab();
			await user.tab();
			expect( lastTabbable ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 4 );
			expect( onNavigateSpy ).toHaveBeenLastCalledWith(
				lastTabbableIndex,
				lastTabbable
			);

			await user.tab();
			expect( lastTabbable ).toHaveFocus();
			expect( onNavigateSpy ).toHaveBeenCalledTimes( 4 );
		} );

		it( 'stops keydown event propagation when the tab key is pressed', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			const externalWrapperOnKeyDownSpy = jest.fn();

			render(
				// Disable reason: this is only for test purposes.
				// eslint-disable-next-line jsx-a11y/no-static-element-interactions
				<div onKeyDown={ externalWrapperOnKeyDownSpy }>
					<TabbableContainerTestCase />
				</div>
			);

			const tabbables = getTabbableContainerTabbables();

			// Move focus to first item
			await user.tab();
			expect( tabbables[ 0 ] ).toHaveFocus();

			await user.keyboard( '[Space]' );
			expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 1 );

			await user.tab();
			expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 1 );
			await user.tab( { shift: true } );
			// This extra call is caused by the "shift" key being pressed
			// on its own before "tab"
			expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 2 );

			await user.keyboard( '[Escape]' );
			expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 3 );
		} );
	} );
} );
