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
	const createMenu = () => saveMenu( { name: menuName } );

	return (
		<form onSubmit={ createMenu }>
			<TextControl
				label={ __( 'Menu name' ) }
				value={ menuName }
				onChange={ setMenuName }
				placeholder={ __( 'Main Navigation' ) }
			/>
			<Button type="submit" isPrimary onClick={ createMenu }>
				{ __( 'Create menu' ) }
			</Button>
		</form>
	);
}
