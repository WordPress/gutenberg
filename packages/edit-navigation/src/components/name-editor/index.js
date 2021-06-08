/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { useEffect, useRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	IsMenuNameControlFocusedContext,
	useMenuEntityProp,
	useSelectedMenuId,
} from '../../hooks';

export function NameEditor() {
	const [ isMenuNameEditFocused, setIsMenuNameEditFocused ] = useContext(
		IsMenuNameControlFocusedContext
	);

	const [ menuId ] = useSelectedMenuId();
	const [ name, setName ] = useMenuEntityProp( 'name', menuId );

	const inputRef = useRef();
	useEffect( () => {
		if ( isMenuNameEditFocused ) inputRef.current.focus();
	}, [ isMenuNameEditFocused ] );

	return (
		<TextControl
			ref={ inputRef }
			help={ __(
				'A short, descriptive name used to refer to this menu elsewhere.'
			) }
			label={ __( 'Name' ) }
			onBlur={ () => setIsMenuNameEditFocused( false ) }
			className="edit-navigation-name-editor__text-control"
			value={ name || '' }
			onChange={ setName }
		/>
	);
}
