/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, BaseControl } from '@wordpress/components';
import { useMenuEntity, useNavigationEditorMenu } from '../../hooks';
import { useInstanceId } from '@wordpress/compose';

export function NameEditor( {
	setIsMenuNameEditFocused,
	isMenuNameEditFocused,
} ) {
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
			<InspectorControls>
				<PanelBody title={ __( 'Menu Settings' ) }>
					<BaseControl label={ __( 'Name' ) } id={ id }>
						<div>
							<input
								ref={ inputRef }
								id={ id }
								onBlur={ () =>
									setIsMenuNameEditFocused( false )
								}
								className="components-text-control__input"
								value={ tmpMenuName }
								onChange={ ( { target: { value } } ) => {
									setTmpMenuName( value );
									editMenuName( value );
								} }
								aria-label={ __( 'Edit menu name' ) }
							/>
						</div>
					</BaseControl>
					<div className="edit-navigation-name-editor__edit-name-description">
						{ __(
							'A short, descriptive name used to refer to this menu elsewhere.'
						) }
					</div>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
