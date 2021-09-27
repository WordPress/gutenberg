/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Navigator, NavigatorScreen, useNavigator } from '../';

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

describe( 'Navigator', () => {
	it( 'should render', () => {
		render( <MyNavigation /> );

		expect( getHomeScreen() ).toBeInTheDocument();
		expect(
			getChildScreen( { throwIfNotFound: false } )
		).not.toBeInTheDocument();
	} );
} );
