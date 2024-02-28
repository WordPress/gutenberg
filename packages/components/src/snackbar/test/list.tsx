/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { click } from '@ariakit/test';

/**
 * Internal dependencies
 */
import SnackbarList from '../list';

window.scrollTo = jest.fn();

describe( 'SnackbarList', () => {
	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'should get focus after a snackbar is dismissed', async () => {
		render(
			<SnackbarList
				notices={ [
					{
						id: 'ID_1',
						content: 'Post published.',
						explicitDismiss: true,
					},
					{
						id: 'ID_2',
						content: 'Post updated.',
						explicitDismiss: true,
					},
				] }
				onRemove={ () => {} }
			/>
		);

		await click(
			screen.getAllByRole( 'button', {
				name: 'Dismiss this notice',
			} )[ 0 ]
		);

		expect( screen.getByTestId( 'snackbar-list' ) ).toHaveFocus();
	} );
} );
