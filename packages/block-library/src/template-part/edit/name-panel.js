/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cleanForSlug } from '@wordpress/url';

export default function TemplatePartNamePanel( { postId, setAttributes } ) {
	const [ title, setTitle ] = useEntityProp(
		'postType',
		'wp_template_part',
		'title',
		postId
	);
	const [ , setSlug ] = useEntityProp(
		'postType',
		'wp_template_part',
		'slug',
		postId
	);
	return (
		<TextControl
			hideLabelFromVision
			label={ __( 'Name' ) }
			value={ title }
			onChange={ ( value ) => {
				setTitle( value );
				const slug = cleanForSlug( value );
				setSlug( slug );
				setAttributes( { slug } );
			} }
		/>
	);
}
