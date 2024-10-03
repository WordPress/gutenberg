/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { createBlobURL } from '@wordpress/blob';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_NONE,
	LINK_DESTINATION_MEDIA,
} from './constants';

const parseShortcodeIds = ( ids ) => {
	if ( ! ids ) {
		return [];
	}

	return ids.split( ',' ).map( ( id ) => parseInt( id, 10 ) );
};

/**
 * Third party block plugins don't have an easy way to detect if the
 * innerBlocks version of the Gallery is running when they run a
 * 3rdPartyBlock -> GalleryBlock transform so this tranform filter
 * will handle this. Once the innerBlocks version is the default
 * in a core release, this could be deprecated and removed after
 * plugin authors have been given time to update transforms.
 *
 * @typedef  {Object} Attributes
 * @typedef  {Object} Block
 * @property {Attributes} attributes The attributes of the block.
 * @param    {Block}      block      The transformed block.
 * @return   {Block}                 The transformed block.
 */
function updateThirdPartyTransformToGallery( block ) {
	if (
		block.name === 'core/gallery' &&
		block.attributes?.images.length > 0
	) {
		const innerBlocks = block.attributes.images.map(
			( { url, id, alt } ) => {
				return createBlock( 'core/image', {
					url,
					id: id ? parseInt( id, 10 ) : null,
					alt,
					sizeSlug: block.attributes.sizeSlug,
					linkDestination: block.attributes.linkDestination,
				} );
			}
		);

		delete block.attributes.ids;
		delete block.attributes.images;
		block.innerBlocks = innerBlocks;
	}

	return block;
}
addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/gallery/update-third-party-transform-to',
	updateThirdPartyTransformToGallery
);

/**
 * Third party block plugins don't have an easy way to detect if the
 * innerBlocks version of the Gallery is running when they run a
 * GalleryBlock -> 3rdPartyBlock transform so this transform filter
 * will handle this. Once the innerBlocks version is the default
 * in a core release, this could be deprecated and removed after
 * plugin authors have been given time to update transforms.
 *
 * @typedef  {Object} Attributes
 * @typedef  {Object} Block
 * @property {Attributes} attributes The attributes of the block.
 * @param    {Block}      toBlock    The block to transform to.
 * @param    {Block[]}    fromBlocks The blocks to transform from.
 * @return   {Block}                 The transformed block.
 */
function updateThirdPartyTransformFromGallery( toBlock, fromBlocks ) {
	const from = Array.isArray( fromBlocks ) ? fromBlocks : [ fromBlocks ];
	const galleryBlock = from.find(
		( transformedBlock ) =>
			transformedBlock.name === 'core/gallery' &&
			transformedBlock.innerBlocks.length > 0 &&
			! transformedBlock.attributes.images?.length > 0 &&
			! toBlock.name.includes( 'core/' )
	);

	if ( galleryBlock ) {
		const images = galleryBlock.innerBlocks.map(
			( { attributes: { url, id, alt } } ) => ( {
				url,
				id: id ? parseInt( id, 10 ) : null,
				alt,
			} )
		);
		const ids = images.map( ( { id } ) => id );
		galleryBlock.attributes.images = images;
		galleryBlock.attributes.ids = ids;
	}

	return toBlock;
}
addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/gallery/update-third-party-transform-from',
	updateThirdPartyTransformFromGallery
);

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/image' ],
			transform: ( attributes ) => {
				// Init the align and size from the first item which may be either the placeholder or an image.
				let { align, sizeSlug } = attributes[ 0 ];
				// Loop through all the images and check if they have the same align and size.
				align = attributes.every(
					( attribute ) => attribute.align === align
				)
					? align
					: undefined;
				sizeSlug = attributes.every(
					( attribute ) => attribute.sizeSlug === sizeSlug
				)
					? sizeSlug
					: undefined;

				const validImages = attributes.filter( ( { url } ) => url );

				const innerBlocks = validImages.map( ( image ) => {
					// Gallery images can't currently be resized so make sure height and width are undefined.
					image.width = undefined;
					image.height = undefined;
					return createBlock( 'core/image', image );
				} );

				return createBlock(
					'core/gallery',
					{
						align,
						sizeSlug,
					},
					innerBlocks
				);
			},
		},
		{
			type: 'shortcode',
			tag: 'gallery',
			transform( { named: { ids, columns = 3, link, orderby } } ) {
				const imageIds = parseShortcodeIds( ids ).map( ( id ) =>
					parseInt( id, 10 )
				);

				let linkTo = LINK_DESTINATION_NONE;
				if ( link === 'post' ) {
					linkTo = LINK_DESTINATION_ATTACHMENT;
				} else if ( link === 'file' ) {
					linkTo = LINK_DESTINATION_MEDIA;
				}

				const galleryBlock = createBlock(
					'core/gallery',
					{
						columns: parseInt( columns, 10 ),
						linkTo,
						randomOrder: orderby === 'rand',
					},
					imageIds.map( ( imageId ) =>
						createBlock( 'core/image', { id: imageId } )
					)
				);

				return galleryBlock;
			},
			isMatch( { named } ) {
				return undefined !== named.ids;
			},
		},
		{
			// When created by drag and dropping multiple files on an insertion point. Because multiple
			// files must not be transformed to a gallery when dropped within a gallery there is another transform
			// within the image block to handle that case. Therefore this transform has to have priority 1
			// set so that it overrrides the image block transformation when mulitple images are dropped outside
			// of a gallery block.
			type: 'files',
			priority: 1,
			isMatch( files ) {
				return (
					files.length !== 1 &&
					files.every(
						( file ) => file.type.indexOf( 'image/' ) === 0
					)
				);
			},
			transform( files ) {
				const innerBlocks = files.map( ( file ) =>
					createBlock( 'core/image', {
						blob: createBlobURL( file ),
					} )
				);

				return createBlock( 'core/gallery', {}, innerBlocks );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/image' ],
			transform: ( { align }, innerBlocks ) => {
				if ( innerBlocks.length > 0 ) {
					return innerBlocks.map(
						( {
							attributes: {
								url,
								alt,
								caption,
								title,
								href,
								rel,
								linkClass,
								id,
								sizeSlug: imageSizeSlug,
								linkDestination,
								linkTarget,
								anchor,
								className,
							},
						} ) =>
							createBlock( 'core/image', {
								align,
								url,
								alt,
								caption,
								title,
								href,
								rel,
								linkClass,
								id,
								sizeSlug: imageSizeSlug,
								linkDestination,
								linkTarget,
								anchor,
								className,
							} )
					);
				}
				return createBlock( 'core/image', { align } );
			},
		},
	],
};

export default transforms;
