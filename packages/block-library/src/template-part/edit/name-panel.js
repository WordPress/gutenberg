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
	const [ slug, setSlug ] = useEntityProp(
		'postType',
		'wp_template_part',
		'slug',
		postId
	);
	return (
		<div className="wp-block-template-part__name-panel">
			<TextControl
				label={ __( 'Name' ) }
				value={ title || slug }
				onChange={ ( value ) => {
					setTitle( value );
					const newSlug = cleanForSlug( value );
					setSlug( newSlug );
					setAttributes( { slug: newSlug } );
				} }
			/>
		</div>
	);
}
