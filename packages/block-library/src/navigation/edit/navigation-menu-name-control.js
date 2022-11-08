/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export default function NavigationMenuNameControl( { kind, type } ) {
	const [ title, updateTitle ] = useEntityProp( kind, type, 'title' );

	return (
		<TextControl
			label={ __( 'Menu name' ) }
			value={ title }
			onChange={ updateTitle }
		/>
	);
}
