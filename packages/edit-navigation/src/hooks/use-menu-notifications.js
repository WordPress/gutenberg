/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { MENU_POST_TYPE, MENU_KIND } from '../constants';

export default function useMenuNotifications( menuId ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const lastDeleteError = useSelect(
		( select ) => {
			return select( coreStore ).getLastEntityDeleteError(
				MENU_KIND,
				MENU_POST_TYPE,
				menuId
			);
		},
		[ menuId ]
	);

	useEffect( () => {
		if ( lastDeleteError ) {
			createErrorNotice( stripHTML( lastDeleteError?.message ), {
				id: 'edit-navigation-error',
			} );
		}
	}, [ lastDeleteError ] );
}
