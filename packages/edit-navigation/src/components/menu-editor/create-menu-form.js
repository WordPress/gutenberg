/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button, TextControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function CreateMenuForm() {
	const [ menuName, setMenuName ] = useState( '' );
	const createMenu = useCallback( () => {
		const path = '/__experimental/menus';
		return apiFetch( {
			path,
			method: 'POST',
			data: {
				// A value of 0 indicates that a new menu should be created.
				menu_id: 0,
				menu_data: {
					name: menuName,
				},
			},
		} );
	}, [ menuName ] );

	return (
		<>
			<TextControl
				label={ __( 'Menu name' ) }
				value={ menuName }
				onChange={ setMenuName }
				placeholder={ __( 'Main Navigation' ) }
			/>
			<Button isPrimary onClick={ createMenu }>
				{ __( 'Create menu' ) }
			</Button>
		</>
	);
}
