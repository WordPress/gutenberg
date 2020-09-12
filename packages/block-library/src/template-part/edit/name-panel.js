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
	const [ status, setStatus ] = useEntityProp(
		'postType',
		'wp_template_part',
		'status',
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
					if ( status !== 'publish' ) {
						setStatus( 'publish' );
					}
					setAttributes( { slug: newSlug, postId } );
				} }
				onFocus={ ( event ) => event.target.select() }
			/>
		</div>
	);
}
