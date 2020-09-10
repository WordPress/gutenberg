/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { cleanForSlug } from '@wordpress/url';

function TemplatePartNamePanel( { postId, setAttributes, ...props }, ref ) {
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
				{ ...props }
				ref={ ref }
				label={ __( 'Name' ) }
				value={ title || slug }
				onChange={ ( value ) => {
					setTitle( value );
					const newSlug = cleanForSlug( value );
					setSlug( newSlug );
					setAttributes( { slug: newSlug, postId } );
				} }
				onFocus={ ( event ) => {
					if ( props.onFocus ) {
						props.onFocus( event );
					}
					event.target.select();
				} }
			/>
		</div>
	);
}

export default forwardRef( TemplatePartNamePanel );
