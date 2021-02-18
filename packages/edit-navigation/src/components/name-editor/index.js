/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { TextControl } from '@wordpress/components';
import {
	IsMenuEditorFocused,
	useMenuEntity,
	useNavigationEditorMenu,
} from '../../hooks';
import { useInstanceId } from '@wordpress/compose';

export function NameEditor() {
	const [ isMenuNameEditFocused, setIsMenuNameEditFocused ] = useContext(
		IsMenuEditorFocused
	);

	const { menuName, menuId } = useNavigationEditorMenu();
	const { editMenuName } = useMenuEntity( menuId );
	const inputRef = useRef();
	const [ tmpMenuName, setTmpMenuName ] = useState( menuName );
	const instanceId = useInstanceId( NameEditor );
	const id = `components-edit-navigation-name-editor__input-${ instanceId }`;
	useEffect( () => setTmpMenuName( menuName ), [ menuName ] );
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
				id={ id }
				onBlur={ () => setIsMenuNameEditFocused( false ) }
				className="components-name-editor__text-control"
				value={ tmpMenuName }
				onChange={ ( value ) => {
					setTmpMenuName( value );
					editMenuName( value );
				} }
				aria-label={ __( 'Edit menu name' ) }
			/>
			{ /*<div>*/ }
			{ /*	<input*/ }
			{ /*		ref={ inputRef }*/ }
			{ /*		id={ id }*/ }
			{ /*		onBlur={ () => setIsMenuNameEditFocused( false ) }*/ }
			{ /*		className="components-text-control__input"*/ }
			{ /*		value={ tmpMenuName }*/ }
			{ /*		onChange={ ( { target: { value } } ) => {*/ }
			{ /*			setTmpMenuName( value );*/ }
			{ /*			editMenuName( value );*/ }
			{ /*		} }*/ }
			{ /*		aria-label={ __( 'Edit menu name' ) }*/ }
			{ /*	/>*/ }
			{ /*</div>*/ }
		</>
	);
}
