import { fireEvent, render, screen } from '@testing-library/react';
import { Navigator, useNavigator } from '@wordpress/components';
import { ScreenHeader } from '../screen-header';

function CurrentPath() {
	const { location } = useNavigator();
	return <span data-testid="path">{ location.path }</span>;
}

function renderAtRevision( headerProps ) {
	return render(
		<Navigator initialPath="/revisions/10">
			<CurrentPath />
			<Navigator.Screen path="/">
				<ScreenHeader title="Styles" />
			</Navigator.Screen>
			<Navigator.Screen path="/revisions/:revisionId?">
				<ScreenHeader title="Revisions (16)" { ...headerProps } />
			</Navigator.Screen>
		</Navigator>
	);
}

describe( 'ScreenHeader back button', () => {
	it( 'walks up one path segment by default, which leaves the user on the revisions screen', () => {
		renderAtRevision();

		fireEvent.click(
			screen.getAllByRole( 'button', { name: 'Back' } )[ 0 ]
		);

		expect( screen.getByTestId( 'path' ) ).toHaveTextContent(
			/^\/revisions$/
		);
	} );

	it( 'uses onBack instead of the default navigation when one is given', () => {
		const onBack = jest.fn();
		renderAtRevision( { onBack } );

		fireEvent.click(
			screen.getAllByRole( 'button', { name: 'Back' } )[ 0 ]
		);

		expect( onBack ).toHaveBeenCalledTimes( 1 );
		// The default parent walk must not run as well, otherwise the caller's
		// destination lands on top of an intermediate location.
		expect( screen.getByTestId( 'path' ) ).toHaveTextContent(
			/^\/revisions\/10$/
		);
	} );
} );
