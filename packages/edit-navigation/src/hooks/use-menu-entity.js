/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * External dependencies
 */
import { isUndefined, negate } from 'lodash';
/**
 * Internal dependencies
 */
import { MENU_KIND, MENU_POST_TYPE } from '../utils/constants';

import { untitledMenu } from './index';

export default function useMenuEntity( menuId ) {
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( 'core' );

	const menuEntityData = [ MENU_KIND, MENU_POST_TYPE, menuId ];
	const editedMenu = useSelect(
		( select ) =>
			select( 'core' ).getEditedEntityRecord( ...menuEntityData ),
		[ menuId ]
	);

	const editedMenuName = menuId && editedMenu.name;

	const saveMenuName = () =>
		negate( isUndefined )( editedMenuName ) &&
		saveEditedEntityRecord( ...menuEntityData );

	const editMenuName = ( name = untitledMenu ) =>
		editEntityRecord( ...menuEntityData, { name } );

	return {
		saveMenuName,
		editMenuName,
	};
}
