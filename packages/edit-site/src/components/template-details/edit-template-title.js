/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useState } from '@wordpress/element';

export default function EditTemplateTitle( { template } ) {
	const [ forceEmpty, setForceEmpty ] = useState( false );
	const [ title, setTitle ] = useEntityProp(
		'postType',
		template.type,
		'title',
		template.id
	);

	return (
		<TextControl
			__nextHasNoMarginBottom
			label={ __( 'Title' ) }
			value={ forceEmpty ? '' : title }
			help={
				template.type !== 'wp_template_part'
					? __(
							'Give the template a title that indicates its purpose, e.g. "Full Width".'
					  )
					: null
			}
			onChange={ ( newTitle ) => {
				if ( ! newTitle && ! forceEmpty ) {
					setForceEmpty( true );
					return;
				}
				setForceEmpty( false );
				setTitle( newTitle );
			} }
			onBlur={ () => setForceEmpty( false ) }
		/>
	);
}
