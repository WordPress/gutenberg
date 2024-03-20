/**
 * External dependencies
 */
import type { ComponentPropsWithoutRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../../button';
import {
	NavigatorProvider,
	NavigatorScreen,
	NavigatorButton,
	NavigatorBackButton,
	NavigatorToParentButton,
	useNavigator,
} from '..';
import type { NavigateOptions } from '../types';

const INVALID_HTML_ATTRIBUTE = {
	raw: ' "\'><=invalid_path',
	escaped: " &quot;'&gt;<=invalid_path",
};

const PATHS = {
	HOME: '/',
	CHILD: '/child',
	NESTED: '/child/nested',
	PRODUCT_PATTERN: '/product/:productId',
	PRODUCT_1: '/product/1',
	PRODUCT_2: '/product/2',
	INVALID_HTML_ATTRIBUTE: INVALID_HTML_ATTRIBUTE.raw,
	NOT_FOUND: '/not-found',
};

const SCREEN_TEXT = {
	home: 'This is the home screen.',
	child: 'This is the child screen.',
	nested: 'This is the nested screen.',
	product: 'This is the product screen.',
	invalidHtmlPath: 'This is the screen with an invalid HTML value as a path.',
};

const BUTTON_TEXT = {
	toNonExistingScreen: 'Navigate to non-existing screen.',
	toChildScreen: 'Navigate to child screen.',
	toNestedScreen: 'Navigate to nested screen.',
	toProductScreen1: 'Navigate to product 1 screen.',
	toProductScreen2: 'Navigate to product 2 screen.',
	toInvalidHtmlPathScreen:
		'Navigate to screen with an invalid HTML value as a path.',
	back: 'Go back',
	backUsingGoTo: 'Go back using goTo',
	goToWithSkipFocus: 'Go to with skipFocus',
};

type CustomTestOnClickHandler = (
	args:
		| {
				type: 'goTo';
				path: string;
				options?: NavigateOptions;
		  }
		| { type: 'goBack' }
		| { type: 'goToParent' }
) => void;

function CustomNavigatorButton( {
	path,
	onClick,
	...props
}: Omit< ComponentPropsWithoutRef< typeof NavigatorButton >, 'onClick' > & {
	onClick?: CustomTestOnClickHandler;
} ) {
	return (
		<NavigatorButton
			onClick={ () => {
				// Used to spy on the values passed to `navigator.goTo`.
				onClick?.( { type: 'goTo', path } );
			} }
			path={ path }
			{ ...props }
		/>
	);
}

function CustomNavigatorGoToBackButton( {
	path,
	onClick,
	...props
}: Omit< ComponentPropsWithoutRef< typeof NavigatorButton >, 'onClick' > & {
	onClick?: CustomTestOnClickHandler;
} ) {
	const { goTo } = useNavigator();
	return (
		<Button
			onClick={ () => {
				goTo( path, { isBack: true } );
				// Used to spy on the values passed to `navigator.goTo`.
				onClick?.( { type: 'goTo', path } );
			} }
			{ ...props }
		/>
	);
}

function CustomNavigatorGoToSkipFocusButton( {
	path,
	onClick,
	...props
}: Omit< ComponentPropsWithoutRef< typeof NavigatorButton >, 'onClick' > & {
	onClick?: CustomTestOnClickHandler;
} ) {
	const { goTo } = useNavigator();
	return (
		<Button
			onClick={ () => {
				goTo( path, { skipFocus: true } );
				// Used to spy on the values passed to `navigator.goTo`.
				onClick?.( { type: 'goTo', path } );
			} }
			{ ...props }
		/>
	);
}

function CustomNavigatorBackButton( {
	onClick,
	...props
}: Omit< ComponentPropsWithoutRef< typeof NavigatorBackButton >, 'onClick' > & {
	onClick?: CustomTestOnClickHandler;
} ) {
	return (
		<NavigatorBackButton
			onClick={ () => {
				// Used to spy on the values passed to `navigator.goBack`.
				onClick?.( { type: 'goBack' } );
			} }
			{ ...props }
		/>
	);
}

function CustomNavigatorToParentButton( {
	onClick,
	...props
}: Omit< ComponentPropsWithoutRef< typeof NavigatorBackButton >, 'onClick' > & {
	onClick?: CustomTestOnClickHandler;
} ) {
	return (
		<NavigatorToParentButton
			onClick={ () => {
				// Used to spy on the values passed to `navigator.goBack`.
				onClick?.( { type: 'goToParent' } );
			} }
			{ ...props }
		/>
	);
}

const ProductScreen = ( {
	onBackButtonClick,
}: {
	onBackButtonClick?: CustomTestOnClickHandler;
} ) => {
	const { params } = useNavigator();

	return (
		<NavigatorScreen path={ PATHS.PRODUCT_PATTERN }>
			<p>{ SCREEN_TEXT.product }</p>
			<p>Product ID is { params.productId }</p>
			<CustomNavigatorBackButton onClick={ onBackButtonClick }>
				{ BUTTON_TEXT.back }
			</CustomNavigatorBackButton>
		</NavigatorScreen>
	);
};

const MyNavigation = ( {
	initialPath = PATHS.HOME,
	onNavigatorButtonClick,
}: {
	initialPath?: string;
	onNavigatorButtonClick?: CustomTestOnClickHandler;
} ) => {
	const [ innerInputValue, setInnerInputValue ] = useState( '' );
	const [ outerInputValue, setOuterInputValue ] = useState( '' );
	return (
		<>
			<NavigatorProvider initialPath={ initialPath }>
				<NavigatorScreen path={ PATHS.HOME }>
					<p>{ SCREEN_TEXT.home }</p>
					{ /*
					 * A button useful to test focus restoration. This button is the first
					 * tabbable item in the screen, but should not receive focus when
					 * navigating to screen as a result of a backwards navigation.
					 */ }
					<button>First tabbable home screen button</button>
					<CustomNavigatorButton
						path={ PATHS.NOT_FOUND }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toNonExistingScreen }
					</CustomNavigatorButton>
					<CustomNavigatorButton
						path={ PATHS.CHILD }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toChildScreen }
					</CustomNavigatorButton>
					<CustomNavigatorButton
						path={ PATHS.PRODUCT_1 }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toProductScreen1 }
					</CustomNavigatorButton>
					<CustomNavigatorButton
						path={ PATHS.PRODUCT_2 }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toProductScreen2 }
					</CustomNavigatorButton>
					<CustomNavigatorButton
						path={ PATHS.INVALID_HTML_ATTRIBUTE }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toInvalidHtmlPathScreen }
					</CustomNavigatorButton>
				</NavigatorScreen>

				<NavigatorScreen path={ PATHS.CHILD }>
					<p>{ SCREEN_TEXT.child }</p>
					{ /*
					 * A button useful to test focus restoration. This button is the first
					 * tabbable item in the screen, but should not receive focus when
					 * navigating to screen as a result of a backwards navigation.
					 */ }
					<button>First tabbable child screen button</button>
					<CustomNavigatorButton
						path={ PATHS.NESTED }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toNestedScreen }
					</CustomNavigatorButton>
					<CustomNavigatorBackButton
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.back }
					</CustomNavigatorBackButton>

					<label htmlFor="test-input-inner">Inner input</label>
					<input
						name="test-input-inner"
						// eslint-disable-next-line no-restricted-syntax
						id="test-input-inner"
						onChange={ ( e ) => {
							setInnerInputValue( e.target.value );
						} }
						value={ innerInputValue }
					/>
				</NavigatorScreen>

				<NavigatorScreen path={ PATHS.NESTED }>
					<p>{ SCREEN_TEXT.nested }</p>
					<CustomNavigatorBackButton
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.back }
					</CustomNavigatorBackButton>
				</NavigatorScreen>

				<ProductScreen onBackButtonClick={ onNavigatorButtonClick } />

				<NavigatorScreen path={ PATHS.INVALID_HTML_ATTRIBUTE }>
					<p>{ SCREEN_TEXT.invalidHtmlPath }</p>
					<CustomNavigatorBackButton
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.back }
					</CustomNavigatorBackButton>
				</NavigatorScreen>

				{ /* A `NavigatorScreen` with `path={ PATHS.NOT_FOUND }` is purposefully not included. */ }
			</NavigatorProvider>

			<label htmlFor="test-input-outer">Outer input</label>
			<input
				name="test-input-outer"
				// eslint-disable-next-line no-restricted-syntax
				id="test-input-outer"
				onChange={ ( e ) => {
					setOuterInputValue( e.target.value );
				} }
				value={ outerInputValue }
			/>
		</>
	);
};

const MyHierarchicalNavigation = ( {
	initialPath = PATHS.HOME,
	onNavigatorButtonClick,
}: {
	initialPath?: string;
	onNavigatorButtonClick?: CustomTestOnClickHandler;
} ) => {
	return (
		<>
			<NavigatorProvider initialPath={ initialPath }>
				<NavigatorScreen path={ PATHS.HOME }>
					<p>{ SCREEN_TEXT.home }</p>
					{ /*
					 * A button useful to test focus restoration. This button is the first
					 * tabbable item in the screen, but should not receive focus when
					 * navigating to screen as a result of a backwards navigation.
					 */ }
					<button>First tabbable home screen button</button>
					<CustomNavigatorButton
						path={ PATHS.CHILD }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toChildScreen }
					</CustomNavigatorButton>
				</NavigatorScreen>

				<NavigatorScreen path={ PATHS.CHILD }>
					<p>{ SCREEN_TEXT.child }</p>
					{ /*
					 * A button useful to test focus restoration. This button is the first
					 * tabbable item in the screen, but should not receive focus when
					 * navigating to screen as a result of a backwards navigation.
					 */ }
					<button>First tabbable child screen button</button>
					<CustomNavigatorButton
						path={ PATHS.NESTED }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toNestedScreen }
					</CustomNavigatorButton>
					<CustomNavigatorToParentButton
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.back }
					</CustomNavigatorToParentButton>
				</NavigatorScreen>

				<NavigatorScreen path={ PATHS.NESTED }>
					<p>{ SCREEN_TEXT.nested }</p>
					<CustomNavigatorToParentButton
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.back }
					</CustomNavigatorToParentButton>
					<CustomNavigatorGoToBackButton
						path={ PATHS.CHILD }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.backUsingGoTo }
					</CustomNavigatorGoToBackButton>
				</NavigatorScreen>
				<CustomNavigatorGoToSkipFocusButton
					path={ PATHS.NESTED }
					onClick={ onNavigatorButtonClick }
				>
					{ BUTTON_TEXT.goToWithSkipFocus }
				</CustomNavigatorGoToSkipFocusButton>
			</NavigatorProvider>
		</>
	);
};

const getScreen = ( screenKey: keyof typeof SCREEN_TEXT ) =>
	screen.getByText( SCREEN_TEXT[ screenKey ] );
const queryScreen = ( screenKey: keyof typeof SCREEN_TEXT ) =>
	screen.queryByText( SCREEN_TEXT[ screenKey ] );
const getNavigationButton = ( buttonKey: keyof typeof BUTTON_TEXT ) =>
	screen.getByRole( 'button', { name: BUTTON_TEXT[ buttonKey ] } );

describe( 'Navigator', () => {
	const originalGetClientRects = window.Element.prototype.getClientRects;

	// `getClientRects` needs to be mocked so that `isVisible` from the `@wordpress/dom`
	// `focusable` module can pass, in a JSDOM env where the DOM elements have no width/height.
	const mockedGetClientRects = jest.fn( () => [
		{
			x: 0,
			y: 0,
			width: 100,
			height: 100,
		},
	] );

	beforeAll( () => {
		// @ts-expect-error There's no need for an exact mock, this is just needed
		// for the tests to pass (see `mockedGetClientRects` inline comments).
		window.Element.prototype.getClientRects =
			jest.fn( mockedGetClientRects );
	} );

	afterAll( () => {
		window.Element.prototype.getClientRects = originalGetClientRects;
	} );

	it( 'should render', () => {
		render( <MyNavigation /> );

		expect( getScreen( 'home' ) ).toBeInTheDocument();
		expect( queryScreen( 'child' ) ).not.toBeInTheDocument();
		expect( queryScreen( 'nested' ) ).not.toBeInTheDocument();
	} );

	it( 'should show a different screen on the first render depending on the value of `initialPath`', () => {
		render( <MyNavigation initialPath={ PATHS.CHILD } /> );

		expect( queryScreen( 'home' ) ).not.toBeInTheDocument();
		expect( getScreen( 'child' ) ).toBeInTheDocument();
		expect( queryScreen( 'nested' ) ).not.toBeInTheDocument();
	} );

	it( 'should ignore changes to `initialPath` after the first render', () => {
		const { rerender } = render( <MyNavigation /> );

		expect( getScreen( 'home' ) ).toBeInTheDocument();
		expect( queryScreen( 'child' ) ).not.toBeInTheDocument();
		expect( queryScreen( 'nested' ) ).not.toBeInTheDocument();

		rerender( <MyNavigation initialPath={ PATHS.CHILD } /> );

		expect( getScreen( 'home' ) ).toBeInTheDocument();
		expect( queryScreen( 'child' ) ).not.toBeInTheDocument();
		expect( queryScreen( 'nested' ) ).not.toBeInTheDocument();
	} );

	it( 'should not rended anything if the `initialPath` does not match any available screen', () => {
		render( <MyNavigation initialPath={ PATHS.NOT_FOUND } /> );

		expect( queryScreen( 'home' ) ).not.toBeInTheDocument();
		expect( queryScreen( 'child' ) ).not.toBeInTheDocument();
		expect( queryScreen( 'nested' ) ).not.toBeInTheDocument();
	} );

	it( 'should navigate across screens', async () => {
		const spy = jest.fn();

		const user = userEvent.setup();

		render( <MyNavigation onNavigatorButtonClick={ spy } /> );

		expect( getScreen( 'home' ) ).toBeInTheDocument();
		expect( getNavigationButton( 'toChildScreen' ) ).toBeInTheDocument();

		// Navigate to child screen.
		await user.click( getNavigationButton( 'toChildScreen' ) );

		expect( getScreen( 'child' ) ).toBeInTheDocument();
		expect( getNavigationButton( 'back' ) ).toBeInTheDocument();

		// Navigate back to home screen.
		await user.click( getNavigationButton( 'back' ) );
		expect( getScreen( 'home' ) ).toBeInTheDocument();
		expect( getNavigationButton( 'toChildScreen' ) ).toBeInTheDocument();

		// Navigate again to child screen.
		await user.click( getNavigationButton( 'toChildScreen' ) );

		expect( getScreen( 'child' ) ).toBeInTheDocument();
		expect( getNavigationButton( 'toNestedScreen' ) ).toBeInTheDocument();

		// Navigate to nested screen.
		await user.click( getNavigationButton( 'toNestedScreen' ) );

		expect( getScreen( 'nested' ) ).toBeInTheDocument();
		expect( getNavigationButton( 'back' ) ).toBeInTheDocument();

		// Navigate back to child screen.
		await user.click( getNavigationButton( 'back' ) );

		expect( getScreen( 'child' ) ).toBeInTheDocument();
		expect( getNavigationButton( 'toNestedScreen' ) ).toBeInTheDocument();

		// Navigate back to home screen.
		await user.click( getNavigationButton( 'back' ) );

		expect( getScreen( 'home' ) ).toBeInTheDocument();
		expect( getNavigationButton( 'toChildScreen' ) ).toBeInTheDocument();

		// Check the values passed to `navigator.goTo()`.
		expect( spy ).toHaveBeenCalledTimes( 6 );
		expect( spy ).toHaveBeenNthCalledWith( 1, {
			path: PATHS.CHILD,
			type: 'goTo',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 2, {
			type: 'goBack',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 3, {
			path: PATHS.CHILD,
			type: 'goTo',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 4, {
			path: PATHS.NESTED,
			type: 'goTo',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 5, {
			type: 'goBack',
		} );
		expect( spy ).toHaveBeenNthCalledWith( 6, {
			type: 'goBack',
		} );
	} );

	it( 'should not render anything if the path does not match any available screen', async () => {
		const spy = jest.fn();

		const user = userEvent.setup();

		render( <MyNavigation onNavigatorButtonClick={ spy } /> );

		expect(
			getNavigationButton( 'toNonExistingScreen' )
		).toBeInTheDocument();

		// Attempt to navigate to non-existing screen. No screens get rendered.
		await user.click( getNavigationButton( 'toNonExistingScreen' ) );

		expect( queryScreen( 'home' ) ).not.toBeInTheDocument();
		expect( queryScreen( 'child' ) ).not.toBeInTheDocument();
		expect( queryScreen( 'nested' ) ).not.toBeInTheDocument();

		// Check the values passed to `navigator.goTo()`.
		expect( spy ).toHaveBeenCalledTimes( 1 );
		expect( spy ).toHaveBeenNthCalledWith( 1, {
			path: PATHS.NOT_FOUND,
			type: 'goTo',
		} );
	} );

	it( 'should escape the value of the `path` prop', async () => {
		render( <MyNavigation /> );

		expect( getScreen( 'home' ) ).toBeInTheDocument();
		expect(
			getNavigationButton( 'toInvalidHtmlPathScreen' )
		).toBeInTheDocument();

		// The following line tests the implementation details, but it's necessary
		// as this would be otherwise transparent to the user.
		// A potential way would be to check if an invalid HTML attribute could
		// be detected in the tests (by JSDom or any other plugin). We could then
		// make sure that an invalid path would not error because it's escaped
		// correctly.
		expect(
			getNavigationButton( 'toInvalidHtmlPathScreen' )
		).toHaveAttribute( 'id', INVALID_HTML_ATTRIBUTE.escaped );
	} );

	it( 'should match correctly paths with named arguments', async () => {
		const user = userEvent.setup();

		render( <MyNavigation /> );

		expect( getScreen( 'home' ) ).toBeInTheDocument();

		// Navigate to Product 1 screen
		await user.click( getNavigationButton( 'toProductScreen1' ) );

		expect( getScreen( 'product' ) ).toBeInTheDocument();

		// Check that named parameter is extracted correctly
		expect( screen.getByText( 'Product ID is 1' ) ).toBeInTheDocument();

		// Navigate back to home screen
		await user.click( getNavigationButton( 'back' ) );

		expect( getScreen( 'home' ) ).toBeInTheDocument();

		// Navigate to Product 2 screen
		await user.click( getNavigationButton( 'toProductScreen2' ) );

		expect( getScreen( 'product' ) ).toBeInTheDocument();

		// Check that named parameter is extracted correctly
		expect( screen.getByText( 'Product ID is 2' ) ).toBeInTheDocument();
	} );

	describe( 'focus management', () => {
		it( 'should restore focus correctly', async () => {
			const user = userEvent.setup();

			render( <MyNavigation /> );

			// Navigate to child screen.
			await user.click( getNavigationButton( 'toChildScreen' ) );

			// The first tabbable element receives focus.
			expect(
				screen.getByRole( 'button', {
					name: 'First tabbable child screen button',
				} )
			).toHaveFocus();

			// Navigate to nested screen.
			await user.click( getNavigationButton( 'toNestedScreen' ) );

			// The first tabbable element receives focus.
			expect( getNavigationButton( 'back' ) ).toHaveFocus();

			// Navigate back to child screen.
			await user.click( getNavigationButton( 'back' ) );

			// Focus is restored on the last element that had focus when the
			// navigation away from the screen occurred.
			expect( getNavigationButton( 'toNestedScreen' ) ).toHaveFocus();

			// Navigate back to home screen.
			await user.click( getNavigationButton( 'back' ) );

			// Focus is restored on the last element that had focus when the
			// navigation away from the screen occurred.
			expect( getNavigationButton( 'toChildScreen' ) ).toHaveFocus();

			// Navigate to product screen for product 2
			await user.click( getNavigationButton( 'toProductScreen2' ) );

			// The first tabbable element receives focus.
			expect( getNavigationButton( 'back' ) ).toHaveFocus();

			// Navigate back to home screen.
			await user.click( getNavigationButton( 'back' ) );

			// Focus is restored on the last element that had focus when the
			// navigation away from the screen occurred.
			expect( getNavigationButton( 'toProductScreen2' ) ).toHaveFocus();
		} );

		it( 'should keep focus on an active element inside navigator, while re-rendering', async () => {
			const user = userEvent.setup();

			render( <MyNavigation /> );

			// Navigate to child screen.
			await user.click( getNavigationButton( 'toChildScreen' ) );

			// The first tabbable element receives focus.
			expect(
				screen.getByRole( 'button', {
					name: 'First tabbable child screen button',
				} )
			).toHaveFocus();

			// Interact with the inner input.
			// The focus should stay on the input element.
			const innerInput = screen.getByLabelText( 'Inner input' );
			await user.type( innerInput, 'd' );
			expect( innerInput ).toHaveFocus();
		} );

		it( 'should keep focus on an active element outside navigator, while re-rendering', async () => {
			const user = userEvent.setup();

			render( <MyNavigation /> );

			// Navigate to child screen.
			await user.click( getNavigationButton( 'toChildScreen' ) );

			// The first tabbable element receives focus.
			expect(
				screen.getByRole( 'button', {
					name: 'First tabbable child screen button',
				} )
			).toHaveFocus();

			// Interact with the outer input.
			// The focus should stay on the input element.
			const outerInput = screen.getByLabelText( 'Outer input' );
			await user.type( outerInput, 'd' );
			expect( outerInput ).toHaveFocus();
		} );

		it( 'should restore focus correctly even when the `path` needs to be escaped', async () => {
			const user = userEvent.setup();

			render( <MyNavigation /> );

			expect( getScreen( 'home' ) ).toBeInTheDocument();

			// Navigate to screen with an invalid HTML value for its `path`.
			await user.click(
				getNavigationButton( 'toInvalidHtmlPathScreen' )
			);

			expect( getScreen( 'invalidHtmlPath' ) ).toBeInTheDocument();

			// Navigate back to home screen, check that the focus restoration selector
			// worked correctly despite the escaping.
			await user.click( getNavigationButton( 'back' ) );

			expect( getScreen( 'home' ) ).toBeInTheDocument();
			expect(
				getNavigationButton( 'toInvalidHtmlPathScreen' )
			).toHaveFocus();
		} );

		it( 'should restore focus while using goTo and goToParent', async () => {
			const user = userEvent.setup();

			render( <MyHierarchicalNavigation /> );

			expect( getScreen( 'home' ) ).toBeInTheDocument();

			// Navigate to child screen.
			await user.click( getNavigationButton( 'toChildScreen' ) );
			expect( getScreen( 'child' ) ).toBeInTheDocument();

			// Navigate to nested screen.
			await user.click( getNavigationButton( 'toNestedScreen' ) );
			expect( getScreen( 'nested' ) ).toBeInTheDocument();
			expect( getNavigationButton( 'back' ) ).toBeInTheDocument();

			// Navigate back to child screen using the back button.
			await user.click( getNavigationButton( 'back' ) );
			expect( getScreen( 'child' ) ).toBeInTheDocument();
			expect( getNavigationButton( 'toNestedScreen' ) ).toHaveFocus();

			// Re navigate to nested screen.
			await user.click( getNavigationButton( 'toNestedScreen' ) );
			expect( getScreen( 'nested' ) ).toBeInTheDocument();
			expect(
				getNavigationButton( 'backUsingGoTo' )
			).toBeInTheDocument();

			// Navigate back to child screen using the go to button.
			await user.click( getNavigationButton( 'backUsingGoTo' ) );
			expect( getScreen( 'child' ) ).toBeInTheDocument();
			expect( getNavigationButton( 'toNestedScreen' ) ).toHaveFocus();

			// Navigate back to home screen.
			await user.click( getNavigationButton( 'back' ) );
			expect( getNavigationButton( 'toChildScreen' ) ).toHaveFocus();
		} );

		it( 'should skip focus based on location `skipFocus` option', async () => {
			const user = userEvent.setup();
			render( <MyHierarchicalNavigation /> );

			// Navigate to child screen with skipFocus.
			await user.click( getNavigationButton( 'goToWithSkipFocus' ) );
			expect( queryScreen( 'home' ) ).not.toBeInTheDocument();
			expect( getScreen( 'nested' ) ).toBeInTheDocument();

			// The clicked button should remain focused.
			expect( getNavigationButton( 'goToWithSkipFocus' ) ).toHaveFocus();

			// Navigate back to parent screen.
			await user.click( getNavigationButton( 'back' ) );
			expect( getScreen( 'child' ) ).toBeInTheDocument();
			// The first tabbable element receives focus.
			expect(
				screen.getByRole( 'button', {
					name: 'First tabbable child screen button',
				} )
			).toHaveFocus();
		} );
	} );
} );
