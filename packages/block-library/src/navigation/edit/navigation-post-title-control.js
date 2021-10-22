/**
 * WordPress dependencies
 */
import { TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export default function NavigationPostTitleControl() {
	const [ title, updateTitle ] = useEntityProp(
		'postType',
		'wp_navigation',
		'title'
	);

	return (
		<TextControl
			label={ __( 'Name' ) }
			value={ title }
			onChange={ updateTitle }
		/>
	);
}
