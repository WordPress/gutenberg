import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { act, screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useEffect, useState } from '@wordpress/element';
import SnackbarList from '../list';

vi.mock( import( '@wordpress/compose' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useReducedMotion: () => false,
} ) );

window.scrollTo = vi.fn();

describe( 'SnackbarList', () => {
	afterEach( () => {
		vi.resetAllMocks();
		vi.useRealTimers();
	} );

	it( 'should get focus after a snackbar is dismissed', async () => {
		await render(
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

		await userEvent.click(
			screen.getAllByRole( 'button', {
				name: 'Dismiss this notice',
			} )[ 0 ]
		);

		expect( screen.getByTestId( 'snackbar-list' ) ).toHaveFocus();
	} );

	it( 'should restart auto-dismissal when a notice is replaced with the same ID', async () => {
		vi.useFakeTimers();
		const onRemove = vi.fn();
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

		await render( <RecreatedNotice /> );

		await act( async () => vi.advanceTimersByTime( 6000 ) );
		expect( onRemove ).toHaveBeenCalledTimes( 1 );

		// Recreate the notice before its 100ms exit animation completes.
		await act( async () => vi.advanceTimersByTime( 50 ) );

		expect( screen.getByTestId( 'snackbar' ) ).toHaveTextContent(
			notice.content
		);

		await act( async () => vi.advanceTimersByTime( 6000 ) );
		expect( onRemove ).toHaveBeenCalledTimes( 2 );
	} );
} );
