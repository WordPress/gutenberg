import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import type { TreeBlock } from '../../store/types';
import type { ListViewImage } from './types';

/**
 * The attributes of the core blocks that hold an image.
 */
type ImageBlockAttributes = {
	url?: string;
	alt?: string;
	backgroundType?: string;
	mediaType?: string;
	mediaUrl?: string;
	mediaAlt?: string;
};

type ImageBlock = {
	name: string;
	clientId: string;
	attributes: ImageBlockAttributes;
	innerBlocks: ImageBlock[];
};

type ImageGetter = (
	block: ImageBlock
) => ListViewImage | ListViewImage[] | undefined;

// Maximum number of images to display in a list view row.
const MAX_IMAGES = 3;
const IMAGE_GETTERS: Partial< Record< string, ImageGetter > > = {
	'core/image': ( { clientId, attributes } ) => {
		if ( attributes.url ) {
			return {
				url: attributes.url,
				alt: attributes.alt || '',
				clientId,
			};
		}
		return undefined;
	},
	'core/cover': ( { clientId, attributes } ) => {
		if ( attributes.backgroundType === 'image' && attributes.url ) {
			return {
				url: attributes.url,
				alt: attributes.alt || '',
				clientId,
			};
		}
		return undefined;
	},
	'core/media-text': ( { clientId, attributes } ) => {
		if ( attributes.mediaType === 'image' && attributes.mediaUrl ) {
			return {
				url: attributes.mediaUrl,
				alt: attributes.mediaAlt || '',
				clientId,
			};
		}
		return undefined;
	},
	'core/gallery': ( { innerBlocks } ) => {
		const images: ListViewImage[] = [];
		const getValues = !! innerBlocks?.length
			? IMAGE_GETTERS[ innerBlocks[ 0 ].name ]
			: undefined;
		if ( ! getValues ) {
			return images;
		}

		for ( const innerBlock of innerBlocks ) {
			// Each image getter returns a single image.
			const img = getValues( innerBlock ) as ListViewImage | undefined;
			if ( img ) {
				images.push( img );
			}
			if ( images.length >= MAX_IMAGES ) {
				return images;
			}
		}

		return images;
	},
};

function getImagesFromBlock(
	block: TreeBlock | null | undefined,
	isExpanded?: boolean
): ListViewImage[] {
	// Only blocks with an image getter are read, so it exists and the
	// attributes match.
	const images = block
		? IMAGE_GETTERS[ block.name ]!( block as unknown as ImageBlock )
		: undefined;

	if ( ! images ) {
		return [];
	}

	if ( ! Array.isArray( images ) ) {
		return [ images ];
	}

	return isExpanded ? [] : images;
}

/**
 * Get a block's preview images for display within a list view row.
 *
 * TODO: Currently only supports images from the core/image and core/gallery
 * blocks. This should be expanded to support other blocks that have images,
 * potentially via an API that blocks can opt into / provide their own logic.
 *
 * @param props            Hook properties.
 * @param props.clientId   The block's clientId.
 * @param props.isExpanded Whether or not the block is expanded in the list view.
 * @return Images.
 */
export default function useListViewImages( {
	clientId,
	isExpanded,
}: {
	clientId: string;
	isExpanded?: boolean;
} ): ListViewImage[] {
	const { block } = useSelect(
		( select ) => {
			const { getBlockName, getBlock } = select( blockEditorStore );
			// Reading the block subscribes to its whole subtree, so only
			// do it for blocks that can show an image.
			// A missing block has no getter either.
			const hasImages =
				!! IMAGE_GETTERS[ getBlockName( clientId ) as string ];
			return { block: hasImages ? getBlock( clientId ) : undefined };
		},
		[ clientId ]
	);
	const images = useMemo( () => {
		return getImagesFromBlock( block, isExpanded );
	}, [ block, isExpanded ] );

	return images;
}
