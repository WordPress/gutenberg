/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { MENU_KIND, MENU_POST_TYPE } from '../constants';

export default function useMenuEntity( menuId ) {
	const { editEntityRecord } = useDispatch( 'core' );

	const menuEntityData = [ MENU_KIND, MENU_POST_TYPE, menuId ];
	const editedMenu = useSelect(
		( select ) =>
			menuId &&
			select( 'core' ).getEditedEntityRecord( ...menuEntityData ),
		[ menuId ]
	);

	return {
		editedMenu,
		menuEntityData,
		editMenuEntityRecord: editEntityRecord,
	};
}
