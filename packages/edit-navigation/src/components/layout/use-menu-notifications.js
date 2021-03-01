/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';

export default function useMenuNotifications( menuId ) {
	const { lastSaveError, lastDeleteError } = useSelect(
		( select ) => ( {
			lastSaveError: select( 'core' ).getLastEntitySaveError(
				'root',
				'menu'
			),
			lastDeleteError: select( 'core' ).getLastEntityDeleteError(
				'root',
				'menu',
				menuId
			),
		} ),
		[ menuId ]
	);

	const { createErrorNotice } = useDispatch( noticesStore );

	const processError = ( error ) => {
		const document = new window.DOMParser().parseFromString(
			error.message,
			'text/html'
		);
		const errorText = document.body.textContent || '';
		createErrorNotice( errorText, { id: 'edit-navigation-error' } );
	};

	useEffect( () => {
		if ( lastSaveError ) {
			processError( lastSaveError );
		}
	}, [ lastSaveError ] );

	useEffect( () => {
		if ( lastDeleteError ) {
			processError( lastDeleteError );
		}
	}, [ lastDeleteError ] );
}
