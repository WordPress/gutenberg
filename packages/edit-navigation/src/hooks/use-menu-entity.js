/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import { MENU_KIND, MENU_POST_TYPE } from '../constants';

export default function useMenuEntity( menuId ) {
	const { editEntityRecord } = useDispatch( coreStore );

	const menuEntityData = [ MENU_KIND, MENU_POST_TYPE, menuId ];
	const editedMenu = useSelect(
		( select ) =>
			menuId &&
			select( coreStore ).getEditedEntityRecord( ...menuEntityData ),
		[ menuId ]
	);

	return {
		editedMenu,
		menuEntityData,
		editMenuEntityRecord: editEntityRecord,
	};
}
