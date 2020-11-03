/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { Icon, ToggleControl, PanelBody } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { postFeaturedImage as icon } from '@wordpress/icons';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';

const placeholderChip = (
	<div className="post-featured-image_placeholder">
		<Icon icon={ icon } />
		<p> { __( 'Featured Image' ) }</p>
	</div>
);

function PostFeaturedImageDisplay( {
	attributes: { isLink },
	setAttributes,
	context: { postId, postType },
} ) {
	const [ featuredImage ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);
	const media = useSelect(
		( select ) =>
			featuredImage && select( 'core' ).getMedia( featuredImage ),
		[ featuredImage ]
	);
	const image = ! media ? (
		placeholderChip
	) : (
		<img
			src={ media.source_url }
			alt={ media.alt_text || __( 'No alternative text set' ) }
		/>
	);

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ sprintf(
							// translators: %s: Name of the post type e.g: "post".
							__( 'Link to %s' ),
							postType
						) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>{ image }</div>
		</>
	);
}

export default function PostFeaturedImageEdit( props ) {
	if ( ! props.context?.postId ) {
		return placeholderChip;
	}
	return <PostFeaturedImageDisplay { ...props } />;
}
