/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';

export default function EditTemplateTitle( { template } ) {
	const [ title, setTitle ] = useEntityProp(
		'postType',
		template.type,
		'title',
		template.id
	);

	return (
		<TextControl
			label={ __( 'Title' ) }
			value={ title }
			help={ __(
				'Give the template a title that indicates its purpose, e.g. "Full Width".'
			) }
			onChange={ ( newTitle ) => {
				setTitle( newTitle || template.slug );
			} }
		/>
	);
}
