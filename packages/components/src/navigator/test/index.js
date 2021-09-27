/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Navigator, NavigatorScreen, useNavigator } from '../';

jest.mock( 'framer-motion', () => {
	const actual = jest.requireActual( 'framer-motion' );
	return {
		__esModule: true,
		...actual,
		AnimatePresence: ( { children } ) => <div>{ children }</div>,
		motion: {
			...actual.motion,
			div: require( 'react' ).forwardRef( ( { children }, ref ) => (
				<div ref={ ref }>{ children }</div>
			) ),
		},
	};
} );

const PATHS = {
	HOME: '/',
	CHILD: '/child',
	NOT_FOUND: '/not-found',
};

function NavigatorButton( { path, isBack = false, ...props } ) {
	const navigator = useNavigator();
	return (
		<button
			onClick={ () => navigator.push( path, { isBack } ) }
			{ ...props }
		/>
	);
}

const MyNavigation = ( { initialPath = PATHS.HOME } ) => (
	<Navigator initialPath={ initialPath }>
		<NavigatorScreen path={ PATHS.HOME }>
			<p>This is the home screen.</p>
			<NavigatorButton path={ PATHS.CHILD }>
				Navigate to child screen.
			</NavigatorButton>
		</NavigatorScreen>

		<NavigatorScreen path={ PATHS.CHILD }>
			<p>This is the child screen.</p>
			<NavigatorButton path={ PATHS.HOME } isBack>
				Go back
			</NavigatorButton>
		</NavigatorScreen>

		{ /* A `NavigatorScreen` with `path={ PATHS.NOT_FOUND }` is purposefully not included */ }
	</Navigator>
);

const getNavigationScreenByText = ( text, { throwIfNotFound = true } = {} ) => {
	const fnName = throwIfNotFound ? 'getByText' : 'queryByText';
	return screen[ fnName ]( text );
};
const getHomeScreen = ( { throwIfNotFound } = {} ) =>
	getNavigationScreenByText( 'This is the home screen.', {
		throwIfNotFound,
	} );
const getChildScreen = ( { throwIfNotFound } = {} ) =>
	getNavigationScreenByText( 'This is the child screen.', {
		throwIfNotFound,
	} );

const getNavigationButtonByText = ( text, { throwIfNotFound = true } = {} ) => {
	const fnName = throwIfNotFound ? 'getByRole' : 'queryByRole';
	return screen[ fnName ]( 'button', { name: text } );
};
const getToChildScreenButton = ( { throwIfNotFound } = {} ) =>
	getNavigationButtonByText( 'Navigate to child screen.', {
		throwIfNotFound,
	} );
const getToHomeScreenButton = ( { throwIfNotFound } = {} ) =>
	getNavigationButtonByText( 'Go back', {
		throwIfNotFound,
	} );

describe( 'Navigator', () => {
	it( 'should render', () => {
		render( <MyNavigation /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
	} );

	it( 'should show a different screen on the first render depending on the value of `initialPath`', () => {
		render( <MyNavigation initialPath={ PATHS.CHILD } /> );

		expect(
			getHomeScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect( getChildScreen() ).toBeInTheDocument();
	} );

	it( 'should ignore changes to `initialPath` after the first render', () => {
		const { rerender } = render( <MyNavigation /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();

		rerender( <MyNavigation initialPath={ PATHS.CHILD } /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
	} );

	// todo: initialPath = not found?

	it( 'should navigate across screens', () => {
		render( <MyNavigation /> );

		expect( getToChildScreenButton() ).toBeInTheDocument();

		// Navigate to child screen
		fireEvent.click( getToChildScreenButton() );

		expect(
			getHomeScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect( getChildScreen() ).toBeInTheDocument();
		expect( getToHomeScreenButton() ).toBeInTheDocument();

		// Navigate back to home screen
		fireEvent.click( getToHomeScreenButton() );

		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
		expect( getHomeScreen() ).toBeInTheDocument();

		// TODO: spy on useNavigator to see if `isBack` is being passed?
	} );
} );

// add link to not found, navigate there to not found

// RTL

// reduced motion
