import { act, render, screen } from '@testing-library/react';
import { click } from '@ariakit/test';
import { useEffect, useState } from '@wordpress/element';
import SnackbarList from '../list';

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useReducedMotion: () => false,
} ) );

window.scrollTo = jest.fn();

describe( 'SnackbarList', () => {
	afterEach( () => {
		jest.resetAllMocks();
		jest.useRealTimers();
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

	it( 'should restart auto-dismissal when a notice is replaced with the same ID', async () => {
		jest.useFakeTimers();
		const onRemove = jest.fn();
		const notice = {
			id: 'ID_1',
			content: 'A collaborator joined.',
		};

		function RecreatedNotice() {
			const [ notices, setNotices ] = useState( [ notice ] );
			const [ shouldRecreate, setShouldRecreate ] = useState( false );

			useEffect( () => {
				if ( ! shouldRecreate ) {
					return;
				}

				const timeoutHandle = setTimeout( () => {
					setNotices( [ { ...notice } ] );
					setShouldRecreate( false );
				}, 50 );

				return () => clearTimeout( timeoutHandle );
			}, [ shouldRecreate ] );

			return (
				<SnackbarList
					notices={ notices }
					onRemove={ ( id ) => {
						onRemove( id );
						setNotices( [] );
						setShouldRecreate( true );
					} }
				/>
			);
		}

		render( <RecreatedNotice /> );

		await act( async () => jest.advanceTimersByTime( 6000 ) );
		expect( onRemove ).toHaveBeenCalledTimes( 1 );

		// Recreate the notice before its 100ms exit animation completes.
		await act( async () => jest.advanceTimersByTime( 50 ) );

		expect( screen.getByTestId( 'snackbar' ) ).toHaveTextContent(
			notice.content
		);

		await act( async () => jest.advanceTimersByTime( 6000 ) );
		expect( onRemove ).toHaveBeenCalledTimes( 2 );
	} );
} );
