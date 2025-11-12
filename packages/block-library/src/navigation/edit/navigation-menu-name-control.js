/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export default function NavigationMenuNameControl() {
	const [ title, updateTitle ] = useEntityProp(
		'postType',
		'wp_navigation',
		'title'
	);

	return (
		<TextControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Menu name' ) }
			value={ title }
			onChange={ updateTitle }
		/>
	);
}
