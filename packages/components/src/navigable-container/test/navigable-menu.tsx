/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
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

const originalGetClientRects = window.HTMLElement.prototype.getClientRects;

describe( 'NavigableMenu', () => {
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

	it( 'moves focus on its focusable children by using the up/down arrow keys', async () => {
		const user = userEvent.setup();

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
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, focusables[ 1 ] );

		await user.keyboard( '[ArrowDown]' );
		expect( focusables[ 2 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 2, focusables[ 2 ] );

		await user.keyboard( '[ArrowUp]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, focusables[ 1 ] );

		// Left/right arrows don't navigate.
		await user.keyboard( '[ArrowLeft]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );

		await user.keyboard( '[ArrowRight]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'moves focus on its focusable children by using the left/right arrow keys when the `orientation`prop is set to `horizontal', async () => {
		const user = userEvent.setup();

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
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, focusables[ 1 ] );

		await user.keyboard( '[ArrowRight]' );
		expect( focusables[ 2 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 2 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 2, focusables[ 2 ] );

		await user.keyboard( '[ArrowLeft]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 1, focusables[ 1 ] );

		// When `orientation="horizontal"`, up/down arrows don't navigate.
		await user.keyboard( '[ArrowUp]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );

		await user.keyboard( '[ArrowDown]' );
		expect( focusables[ 1 ] ).toHaveFocus();
		expect( onNavigateSpy ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should stop at the edges when the `cycle` prop is set to `false`', async () => {
		const user = userEvent.setup();

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
		expect( onNavigateSpy ).toHaveBeenLastCalledWith( 0, firstFocusable );

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
		const user = userEvent.setup();

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

		await user.keyboard( '[ArrowDown][ArrowUp][ArrowLeft][ArrowRight]' );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 1 );

		await user.keyboard( '[Escape]' );
		expect( externalWrapperOnKeyDownSpy ).toHaveBeenCalledTimes( 2 );
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
