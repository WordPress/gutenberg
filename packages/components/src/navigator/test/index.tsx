/**
 * External dependencies
 */
import type { ReactNode, ForwardedRef, ComponentPropsWithoutRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	NavigatorProvider,
	NavigatorScreen,
	NavigatorButton,
	NavigatorBackButton,
} from '..';

jest.useFakeTimers();

jest.mock( 'framer-motion', () => {
	const actual = jest.requireActual( 'framer-motion' );
	return {
		__esModule: true,
		...actual,
		AnimatePresence:
			( { children }: { children?: ReactNode } ) =>
			() =>
				<div>{ children }</div>,
		motion: {
			...actual.motion,
			div: require( 'react' ).forwardRef(
				(
					{ children }: { children?: ReactNode },
					ref: ForwardedRef< HTMLDivElement >
				) => <div ref={ ref }>{ children }</div>
			),
		},
	};
} );

const INVALID_HTML_ATTRIBUTE = {
	raw: ' "\'><=invalid_path',
	escaped: " &quot;'&gt;<=invalid_path",
};

const PATHS = {
	HOME: '/',
	CHILD: '/child',
	NESTED: '/child/nested',
	INVALID_HTML_ATTRIBUTE: INVALID_HTML_ATTRIBUTE.raw,
	NOT_FOUND: '/not-found',
};

const SCREEN_TEXT = {
	home: 'This is the home screen.',
	child: 'This is the child screen.',
	nested: 'This is the nested screen.',
	invalidHtmlPath: 'This is the screen with an invalid HTML value as a path.',
};

const BUTTON_TEXT = {
	toNonExistingScreen: 'Navigate to non-existing screen.',
	toChildScreen: 'Navigate to child screen.',
	toNestedScreen: 'Navigate to nested screen.',
	toInvalidHtmlPathScreen:
		'Navigate to screen with an invalid HTML value as a path.',
	back: 'Go back',
};

type CustomTestOnClickHandler = (
	args:
		| {
				type: 'goTo';
				path: string;
		  }
		| { type: 'goBack' }
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

function CustomNavigatorButtonWithFocusRestoration( {
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
						path={ PATHS.INVALID_HTML_ATTRIBUTE }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toInvalidHtmlPathScreen }
					</CustomNavigatorButton>
				</NavigatorScreen>

				<NavigatorScreen path={ PATHS.CHILD }>
					<p>{ SCREEN_TEXT.child }</p>
					<CustomNavigatorButtonWithFocusRestoration
						path={ PATHS.NESTED }
						onClick={ onNavigatorButtonClick }
					>
						{ BUTTON_TEXT.toNestedScreen }
					</CustomNavigatorButtonWithFocusRestoration>
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

		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

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

	it( 'should not rended anything if the path does not match any available screen', async () => {
		const spy = jest.fn();

		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

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
		const user = userEvent.setup( {
			advanceTimers: jest.advanceTimersByTime,
		} );

		render( <MyNavigation /> );

		expect( getScreen( 'home' ) ).toBeInTheDocument();
		expect(
			getNavigationButton( 'toInvalidHtmlPathScreen' )
		).toBeInTheDocument();

		// The following line tests the implementation details, but it's necessary
		// as this would be otherwise transparent to the user.
		expect(
			getNavigationButton( 'toInvalidHtmlPathScreen' )
		).toHaveAttribute( 'id', INVALID_HTML_ATTRIBUTE.escaped );

		// Navigate to screen with an invalid HTML value for its `path`.
		await user.click( getNavigationButton( 'toInvalidHtmlPathScreen' ) );

		expect( getScreen( 'invalidHtmlPath' ) ).toBeInTheDocument();
		expect( getNavigationButton( 'back' ) ).toBeInTheDocument();

		// Navigate back to home screen, check that the focus restoration selector
		// worked correctly despite the escaping.
		await user.click( getNavigationButton( 'back' ) );

		expect( getScreen( 'home' ) ).toBeInTheDocument();
		expect(
			getNavigationButton( 'toInvalidHtmlPathScreen' )
		).toHaveFocus();
	} );

	describe( 'focus management', () => {
		it( 'should restore focus correctly', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			render( <MyNavigation /> );

			// Navigate to child screen.
			await user.click( getNavigationButton( 'toChildScreen' ) );

			// The first tabbable element receives focus.
			expect( getNavigationButton( 'toNestedScreen' ) ).toHaveFocus();

			// Navigate to nested screen.
			await user.click( getNavigationButton( 'toNestedScreen' ) );

			// The first tabbable element receives focus.
			expect( getNavigationButton( 'back' ) ).toHaveFocus();

			// Navigate back to child screen.
			await user.click( getNavigationButton( 'back' ) );

			// The first tabbable element receives focus.
			expect( getNavigationButton( 'toNestedScreen' ) ).toHaveFocus();

			// Navigate back to home screen, check that focus was correctly restored.
			await user.click( getNavigationButton( 'back' ) );

			// The first tabbable element receives focus.
			expect( getNavigationButton( 'toChildScreen' ) ).toHaveFocus();
		} );

		it( 'should keep focus on an active element inside navigator, while re-rendering', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			render( <MyNavigation /> );

			// Navigate to child screen.
			await user.click( getNavigationButton( 'toChildScreen' ) );

			// The first tabbable element receives focus.
			expect( getNavigationButton( 'toNestedScreen' ) ).toHaveFocus();

			// Interact with the inner input.
			// The focus should stay on the input element.
			const innerInput = screen.getByLabelText( 'Inner input' );
			await user.type( innerInput, 'd' );
			expect( innerInput ).toHaveFocus();
		} );

		it( 'should keep focus on an active element outside navigator, while re-rendering', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			render( <MyNavigation /> );

			// Navigate to child screen.
			await user.click( getNavigationButton( 'toChildScreen' ) );

			// The first tabbable element receives focus.
			expect( getNavigationButton( 'toNestedScreen' ) ).toHaveFocus();

			// Interact with the outer input.
			// The focus should stay on the input element.
			const outerInput = screen.getByLabelText( 'Outer input' );
			await user.type( outerInput, 'd' );
			expect( outerInput ).toHaveFocus();
		} );
	} );
} );
