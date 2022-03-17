/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { MediaUpload } from '@wordpress/media-utils';
import { createHigherOrderComponent } from '@wordpress/compose';
import { group } from '@wordpress/icons';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const replaceMediaUpload = () => MediaUpload;

addFilter(
	'editor.MediaUpload',
	'core/edit-post/replace-media-upload',
	replaceMediaUpload
);

function getMediaSourceUrlBySizeSlug( media, slug ) {
	return (
		media?.media_details?.sizes?.[ slug ]?.source_url || media?.source_url
	);
}

const addFeaturedImageToolbarItem = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const {
				attributesContext = [],
				attributes,
				setAttributes,
				name: blockName,
			} = props;

			const { useFeaturedImage } = attributes;

			const { sizeSlug } = attributes;
			const [ featuredImage ] = useEntityProp(
				'postType',
				'post',
				'featured_media'
			);

			const media = useSelect(
				( select ) =>
					featuredImage &&
					select( coreStore ).getMedia( featuredImage, {
						context: 'view',
					} ),
				[ featuredImage ]
			);
			const mediaUrl = getMediaSourceUrlBySizeSlug( media, sizeSlug );

			if ( useFeaturedImage ) {
				attributesContext.push( { url: mediaUrl } );
			}

			if (
				( 'core/image' !== blockName && 'core/cover' !== blockName ) ||
				! mediaUrl
			) {
				return <BlockEdit { ...props } />;
			}
			return (
				<>
					<BlockControls group="other">
						<ToolbarButton
							icon={ group /*this is temporary*/ }
							label={ __( 'Use featured image' ) }
							isPressed={ useFeaturedImage }
							onClick={ () => {
								setAttributes( {
									useFeaturedImage: ! useFeaturedImage,
								} );
							} }
						/>
					</BlockControls>
					<BlockEdit
						{ ...props }
						attributesContext={ attributesContext }
					/>
				</>
			);
		};
	},
	'addFeaturedImageToolbarItem'
);

addFilter(
	'editor.BlockEdit',
	'core/edit-post/bind-featured-image',
	addFeaturedImageToolbarItem
);
