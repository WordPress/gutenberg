/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useContext } from '@wordpress/element';

/**
 * External dependencies
 */
import { unset } from 'lodash';

/**
 * Internal dependencies
 */
import { TextControl } from '@wordpress/components';
import UnsavedChangesIndicator from '../unsaved-changes-indicator';
import {
	IsMenuNameControlFocusedContext,
	UnsavedElementsContext,
	untitledMenu,
	useMenuEntity,
	useSelectedMenuData,
} from '../../hooks';

export function NameEditor() {
	const [ isMenuNameEditFocused, setIsMenuNameEditFocused ] = useContext(
		IsMenuNameControlFocusedContext
	);
	const [ unsavedElements, setUnsavedElements ] = useContext(
		UnsavedElementsContext
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

	const hasMenuNameChanged = editedMenuName !== savedMenuName;

	useEffect( () => {
		if ( hasMenuNameChanged ) {
			setUnsavedElements( {
				...unsavedElements,
				name: editedMenuName,
			} );
		} else if ( unsavedElements.name ) {
			unset( unsavedElements, 'name' );
			setUnsavedElements( { ...unsavedElements } );
		}
	}, [ hasMenuNameChanged ] );

	const editMenuName = ( name = untitledMenu ) =>
		editMenuEntityRecord( ...menuEntityData, { name } );

	const inputRef = useRef();
	useEffect( () => {
		if ( isMenuNameEditFocused ) inputRef.current.focus();
	}, [ isMenuNameEditFocused ] );
	return (
		<UnsavedChangesIndicator hasUnsavedChanges={ hasMenuNameChanged }>
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
		</UnsavedChangesIndicator>
	);
}
