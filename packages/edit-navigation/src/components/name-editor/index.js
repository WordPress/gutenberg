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
	useSelectedMenuData,
} from '../../hooks';

function DotIndicator( { children, showDot = false } ) {
	return showDot ? (
		<div className="dot-indicator">{ children }</div>
	) : (
		{ children }
	);
}

export function NameEditor() {
	const [ isMenuNameEditFocused, setIsMenuNameEditFocused ] = useContext(
		IsMenuNameControlFocusedContext
	);

	const { menuId } = useSelectedMenuData();
	const {
		editedMenu,
		savedMenu,
		editMenuEntityRecord,
		menuEntityData,
	} = useMenuEntity( menuId );
	const editedMenuName = menuId && editedMenu.name;
	const savedMenuName = menuId && savedMenu.name;

	const hasMenuNameChanged = editedMenuName === savedMenuName;

	const editMenuName = ( name = untitledMenu ) =>
		editMenuEntityRecord( ...menuEntityData, { name } );

	const inputRef = useRef();
	useEffect( () => {
		if ( isMenuNameEditFocused ) inputRef.current.focus();
	}, [ isMenuNameEditFocused ] );
	return (
		<DotIndicator showDot={ hasMenuNameChanged }>
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
			)
		</DotIndicator>
	);
}
