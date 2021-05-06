/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { TextControl } from '@wordpress/components';
import {
	IsMenuNameControlFocusedContext,
	untitledMenu,
	useMenuEntity,
	useSelectedMenuId,
} from '../../hooks';

export function NameEditor() {
	const [ isMenuNameEditFocused, setIsMenuNameEditFocused ] = useContext(
		IsMenuNameControlFocusedContext
	);

	const [ menuId ] = useSelectedMenuId();
	const { editedMenu, editMenuEntityRecord, menuEntityData } = useMenuEntity(
		menuId
	);
	const editedMenuName = menuId && editedMenu.name;

	const editMenuName = ( name = untitledMenu ) =>
		editMenuEntityRecord( ...menuEntityData, { name } );

	const inputRef = useRef();
	useEffect( () => {
		if ( isMenuNameEditFocused ) inputRef.current.focus();
	}, [ isMenuNameEditFocused ] );
	return (
		<>
			<TextControl
				ref={ inputRef }
				help={ __(
					'A short, descriptive name used to refer to this menu elsewhere.'
				) }
				label={ __( 'Name' ) }
				onBlur={ () => setIsMenuNameEditFocused( false ) }
				className="edit-navigation-name-editor__text-control"
				value={ editedMenuName }
				onChange={ editMenuName }
			/>
		</>
	);
}
