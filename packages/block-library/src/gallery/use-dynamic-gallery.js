/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { pickRelevantMediaFiles } from './shared';
import { getHrefAndDestination } from './utils';
import { getUpdatedLinkTargetSettings } from '../image/utils';
import {
	getSourceQuery,
	getDynamicSource,
	ATTACHED_MEDIA,
	DEFAULT_ORDERBY,
	DEFAULT_ORDER,
	MAX_IMAGES,
} from './dynamic-source';

const EMPTY_ARRAY = [];

/**
 * Builds the attributes for a `core/image` block from a media (attachment)
 * record, applying the gallery-wide settings that affect how the image renders.
 *
 * Used to construct the (non-persisted) image blocks previewed in dynamic mode,
 * and the real image blocks created when a dynamic gallery is converted
 * ("pinned") back to individual images. The frontend equivalent is
 * `block_core_gallery_render_dynamic_image()` in `index.php`.
 *
 * @param {Object} media             A media object as returned by the REST API.
 * @param {Object} galleryAttributes The gallery block's attributes.
 * @return {Object} Attributes to pass to `createBlock( 'core/image', ... )`.
 */
function buildImageBlockAttributes( media, galleryAttributes ) {
	const { sizeSlug, linkTo, linkTarget, aspectRatio } = galleryAttributes;
	const hasAspectRatio = !! aspectRatio && aspectRatio !== 'auto';

	return {
		id: media.id,
		...pickRelevantMediaFiles( media, sizeSlug ),
		...getHrefAndDestination( media, linkTo ),
		...getUpdatedLinkTargetSettings( linkTarget, galleryAttributes ),
		sizeSlug,
		// Raw caption, mirroring the frontend (`index.php`). Gap: the REST API
		// exposes no caption run through `wp_get_attachment_caption`, so neither
		// side applies that filter.
		caption: media.caption?.raw || '',
		alt: media.alt_text || '',
		aspectRatio: hasAspectRatio ? aspectRatio : undefined,
		// Pair `scale` with `aspectRatio` so the image crops rather than stretches,
		// matching the image block's UI and the frontend (`index.php`).
		scale: hasAspectRatio ? 'cover' : undefined,
	};
}

/**
 * Builds a set of `core/image` blocks from the resolved media, applying the
 * gallery-wide settings. Each call mints fresh client IDs, so it can produce
 * both the editor preview and the materialized inner blocks on convert.
 *
 * @param {Object[]} media             Media records from the REST API.
 * @param {Object}   galleryAttributes The image-relevant gallery attributes.
 * @return {Object[]} New `core/image` block instances.
 */
function buildImageBlocks( media, galleryAttributes ) {
	return media.map( ( mediaItem ) =>
		createBlock(
			'core/image',
			buildImageBlockAttributes( mediaItem, galleryAttributes )
		)
	);
}

/**
 * Bundles the Gallery block's "dynamic mode" source resolution and actions.
 *
 * Dynamic mode resolves the gallery's images from a configured source
 * (`attributes.dynamicContent`) instead of from manually-added inner image
 * blocks. This hook centralizes the shared, single-instance pieces — the source
 * resolution (one `getEntityRecords`), the editor-preview blocks, and the
 * mode/ordering actions — out of the block's `edit` component. Transient UI
 * concerns (e.g. the convert-to-dynamic confirmation) live in the components
 * that own them.
 *
 * @param {Object}   options
 * @param {Object}   options.attributes    The gallery block attributes.
 * @param {Function} options.setAttributes The block's `setAttributes`.
 * @param {string}   options.clientId      The block client ID.
 * @param {?number}  options.postId        The current post ID (from block context).
 * @param {?string}  options.postType      The current post type (from block context).
 * @return {Object} Dynamic-mode source data and actions.
 */
export default function useDynamicGallery( {
	attributes,
	setAttributes,
	clientId,
	postId,
	postType,
} ) {
	const { dynamicContent } = attributes;

	// Whether dynamic mode makes sense in the current editing context. A
	// `postType` means the block will resolve against some post at render time —
	// either a concrete post (post/page editor, Query Loop item) or a post-bound
	// template (`single`, `page`) whose post is filled in by `get_the_ID()` on the
	// frontend (see `index.php`). Without it (template part, pattern, generic
	// template) there's no post to attach to, so the source can never resolve.
	const canUseDynamicSource = !! postType;

	// The descriptor for the configured source (its `title`/`description`/
	// `emptyMessage`), resolved once here so consumers read the copy without
	// re-deriving it from `dynamicContent`. `undefined` for an unknown source.
	const sourceDescriptor = getDynamicSource( dynamicContent?.source );

	// Current source ordering, falling back to the shared defaults when unset.
	const sourceOrderby = dynamicContent?.args?.orderBy ?? DEFAULT_ORDERBY;
	const sourceOrder = dynamicContent?.args?.order ?? DEFAULT_ORDER;

	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	// Resolve the configured source to a media query. `null` (static mode, or an
	// unresolvable source) short-circuits the select below so no request fires.
	const query = useMemo(
		() =>
			dynamicContent
				? getSourceQuery( dynamicContent, { postId } )
				: null,
		[ dynamicContent, postId ]
	);

	const { dynamicMedia, dynamicMediaTotal, isResolvingDynamic } = useSelect(
		( select ) => {
			if ( ! query ) {
				return {
					dynamicMedia: EMPTY_ARRAY,
					dynamicMediaTotal: 0,
					isResolvingDynamic: false,
				};
			}
			const selectorArgs = [ 'postType', 'attachment', query ];
			return {
				dynamicMedia:
					select( coreStore ).getEntityRecords( ...selectorArgs ) ??
					EMPTY_ARRAY,
				// Total matching attachments (the `X-WP-Total` header), which the
				// query's `per_page` cap doesn't bound — so it reveals when the
				// post has more attached images than are shown.
				dynamicMediaTotal:
					select( coreStore ).getEntityRecordsTotalItems(
						...selectorArgs
					) ?? 0,
				isResolvingDynamic: ! select( coreStore ).hasFinishedResolution(
					'getEntityRecords',
					selectorArgs
				),
			};
		},
		[ query ]
	);

	// The source caps results at `MAX_IMAGES` (matching the frontend), so flag
	// when the post has more attached images than the gallery can show.
	const hasMoreImagesThanCap = dynamicMediaTotal > MAX_IMAGES;

	// The only gallery settings that affect how an image renders, and so the
	// only ones `buildImageBlockAttributes` reads. Depending on this narrowed
	// set (rather than the whole `attributes` object) keeps the preview from
	// rebuilding on unrelated edits, e.g. typing in the gallery caption.
	const { sizeSlug, linkTo, linkTarget, aspectRatio } = attributes;
	const imageAttributes = useMemo(
		() => ( { sizeSlug, linkTo, linkTarget, aspectRatio } ),
		[ sizeSlug, linkTo, linkTarget, aspectRatio ]
	);

	// The (non-persisted) `core/image` blocks used for the editor preview.
	// Rebuilt when the resolved media or an image-relevant setting changes.
	const dynamicImageBlocks = useMemo(
		() => buildImageBlocks( dynamicMedia, imageAttributes ),
		[ dynamicMedia, imageAttributes ]
	);

	// Context the gallery provides to its (previewed) image blocks.
	const galleryContext = useMemo(
		() => ( {
			allowResize: attributes.allowResize ?? false,
			imageCrop: attributes.imageCrop,
			fixedHeight: attributes.fixedHeight,
			navigationButtonType: attributes.navigationButtonType,
		} ),
		[
			attributes.allowResize,
			attributes.imageCrop,
			attributes.fixedHeight,
			attributes.navigationButtonType,
		]
	);

	// Switches the gallery into dynamic mode, displaying images attached to the
	// current post. Clearing the inner blocks removes the manually-added images:
	// they're the gallery's image data, so there's nothing else to reset. The
	// legacy `images`/`ids` attributes aren't touched — they're back-compat shims
	// for the pre-innerBlocks format (see `deprecated.js`/`transforms.js`), empty
	// on any gallery reachable here.
	function enableDynamicMode() {
		setAttributes( { dynamicContent: { source: ATTACHED_MEDIA } } );
		replaceInnerBlocks( clientId, [] );
	}

	// "Pins" a dynamic gallery: materializes the currently-resolved media as
	// real, editable image blocks and leaves dynamic mode.
	function convertToStatic() {
		// Build fresh blocks rather than reusing the preview's `dynamicImageBlocks`
		// so the materialized inner blocks get their own client IDs, distinct from
		// the (disabled) preview instances.
		replaceInnerBlocks(
			clientId,
			buildImageBlocks( dynamicMedia, imageAttributes )
		);
		setAttributes( { dynamicContent: undefined } );
	}

	// Updates the source ordering within `dynamicContent.args`. Passing
	// `undefined` (or the default order) strips the keys so they aren't
	// persisted redundantly and the ToolsPanel item reads as unset.
	function setSourceOrder( nextOrderby, nextOrder ) {
		const nextArgs = { ...dynamicContent?.args };
		delete nextArgs.orderBy;
		delete nextArgs.order;
		if (
			nextOrderby !== undefined &&
			( nextOrderby !== DEFAULT_ORDERBY || nextOrder !== DEFAULT_ORDER )
		) {
			nextArgs.orderBy = nextOrderby;
			nextArgs.order = nextOrder;
		}
		const nextSource = { ...dynamicContent };
		if ( Object.keys( nextArgs ).length ) {
			nextSource.args = nextArgs;
		} else {
			delete nextSource.args;
		}
		setAttributes( { dynamicContent: nextSource } );
	}

	// Resets the source to its bare form: keeps the source kind, drops its args.
	function resetSource() {
		setAttributes( {
			dynamicContent: { source: dynamicContent.source },
		} );
	}

	return {
		dynamicContent,
		canUseDynamicSource,
		sourceDescriptor,
		hasMoreImagesThanCap,
		dynamicMediaTotal,
		sourceOrderby,
		sourceOrder,
		dynamicMedia,
		dynamicImageBlocks,
		isResolvingDynamic,
		galleryContext,
		enableDynamicMode,
		convertToStatic,
		setSourceOrder,
		resetSource,
	};
}
