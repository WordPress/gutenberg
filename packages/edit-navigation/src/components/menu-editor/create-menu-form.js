/**
 * WordPress dependencies
 */
import { Button, TextControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function CreateMenuForm() {
	const [ menuName, setMenuName ] = useState( '' );
	const { saveMenu } = useDispatch( 'core' );

	return (
		<>
			<TextControl
				label={ __( 'Menu name' ) }
				value={ menuName }
				onChange={ setMenuName }
				placeholder={ __( 'Main Navigation' ) }
			/>
			<Button isPrimary onClick={ () => saveMenu( { name: menuName } ) }>
				{ __( 'Create menu' ) }
			</Button>
		</>
	);
}
