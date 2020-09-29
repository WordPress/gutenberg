/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	Icon,
	ToggleControl,
	TextControl,
	PanelBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { postFeaturedImage as icon } from '@wordpress/icons';
import { InspectorControls } from '@wordpress/block-editor';

function PostFeaturedImageDisplay( {
	attributes: { isLink, rel, linkTarget },
	setAttributes,
	context: { postId, postType },
} ) {
	const [ featuredImage ] = useEntityProp(
		'postType',
		postType,
		'featured_media',
		postId
	);
	const { media, post } = useSelect(
		( select ) => {
			const { getMedia, getEditedEntityRecord } = select( 'core' );
			return {
				media: featuredImage && getMedia( featuredImage ),
				post: getEditedEntityRecord( 'postType', postType, postId ),
			};
		},
		[ postType, postId, featuredImage ]
	);
	if ( ! media ) {
		return (
			<div className="post-featured-image_placeholder">
				<Icon icon={ icon } />
				<p> { __( 'Featured Image' ) }</p>
			</div>
		);
	}
	const alt = media.alt_text || __( 'No alternative text set' );
	let image = <img src={ media.source_url } alt={ alt } />;
	if ( isLink ) {
		image = (
			<a href={ post.link } target={ linkTarget } rel={ rel }>
				{ image }
			</a>
		);
	}
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Link settings' ) }>
					<ToggleControl
						label={ __( 'Make featured image a link' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
					{ isLink && (
						<>
							<ToggleControl
								label={ __( 'Open in new tab' ) }
								onChange={ ( value ) =>
									setAttributes( {
										linkTarget: value ? '_blank' : '_self',
									} )
								}
								checked={ linkTarget === '_blank' }
							/>
							<TextControl
								label={ __( 'Link rel' ) }
								value={ rel }
								onChange={ ( newRel ) =>
									setAttributes( { rel: newRel } )
								}
							/>
						</>
					) }
				</PanelBody>
			</InspectorControls>
			<div className={ isLink ? 'post-featured-image__link' : '' }>
				{ image }
			</div>
		</>
	);
}

export default function PostFeaturedImageEdit( props ) {
	if ( ! props.context?.postId ) {
		return __( 'Featured Image' );
	}
	return <PostFeaturedImageDisplay { ...props } />;
}
