import { useMemo } from '@wordpress/element';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createBlock } from '@wordpress/blocks';
import { pickRelevantMediaFiles } from './shared';
import { getHrefAndDestination } from './utils';
import { getUpdatedLinkTargetSettings } from '../image/utils';
import {
	getSourceQuery,
	getDynamicSource,
	getDynamicSources,
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

	// The sources that can be offered here, as `[ name, descriptor ]` pairs.
	//
	// A source flagged `requiresPost` resolves relative to the post being
	// rendered, so it needs a `postType` — meaning the block will resolve against
	// some post at render time, either a concrete post (post/page editor, Query
	// Loop item) or a post-bound template (`single`, `page`) whose post is filled
	// in by `get_the_ID()` on the frontend (see `index.php`). Without one
	// (template part, pattern, generic template) there's nothing to attach to, so
	// such a source can never resolve. Sources that name their own content —
	// a media folder — are offered everywhere.
	const availableSources = useMemo(
		() =>
			getDynamicSources().filter(
				( [ , descriptor ] ) =>
					( ! descriptor.requiresPost || !! postType ) &&
					( descriptor.isAvailable?.() ?? true )
			),
		[ postType ]
	);

	// Whether dynamic mode makes sense in the current editing context at all.
	const canUseDynamicSource = availableSources.length > 0;

	// The sources offered as entry points on the block placeholder. Unlike
	// `availableSources` this ignores `requiresPost`: with no post type to
	// preview against, a post-relative source still resolves at render time via
	// `get_the_ID()` (see `index.php`) — e.g. in a template part or pattern shown
	// on a singular page. A source gated off by its own `isAvailable` is still
	// excluded, since it could never resolve at all.
	const enterableSources = useMemo(
		() =>
			getDynamicSources().filter(
				( [ , descriptor ] ) => descriptor.isAvailable?.() ?? true
			),
		[]
	);

	// The descriptor for the configured source (its `title`/`description`/
	// `emptyMessage`), resolved once here so consumers read the copy without
	// re-deriving it from `dynamicContent`. `undefined` for an unknown source.
	const sourceDescriptor = getDynamicSource( dynamicContent?.source );

	// Current source ordering, falling back to the shared defaults when unset.
	const sourceOrderby = dynamicContent?.args?.orderBy ?? DEFAULT_ORDERBY;
	const sourceOrder = dynamicContent?.args?.order ?? DEFAULT_ORDER;
	// The folder a `core/media-folder` gallery points at, if any.
	const sourceFolderId = dynamicContent?.args?.folderId;

	const registry = useRegistry();
	const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

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
	function enableDynamicMode( source = ATTACHED_MEDIA ) {
		// Batch the attribute change and the inner-block reset into a single
		// undo level: they're two halves of one mode switch, so one undo should
		// revert both. Marking the second dispatch non-persistent stops it from
		// opening a second undo level, which would otherwise leave the gallery
		// in a half-switched state (dynamic source set, images still present).
		registry.batch( () => {
			setAttributes( { dynamicContent: { source } } );
			__unstableMarkNextChangeAsNotPersistent();
			replaceInnerBlocks( clientId, [] );
		} );
	}

	// "Pins" a dynamic gallery: materializes the currently-resolved media as
	// real, editable image blocks and leaves dynamic mode.
	function convertToStatic() {
		// Batch the inner-block materialization and the attribute change into a
		// single undo level so one undo reverts the whole conversion (see
		// `enableDynamicMode`). Build fresh blocks rather than reusing the
		// preview's `dynamicImageBlocks` so the materialized inner blocks get
		// their own client IDs, distinct from the (disabled) preview instances.
		registry.batch( () => {
			replaceInnerBlocks(
				clientId,
				buildImageBlocks( dynamicMedia, imageAttributes )
			);
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { dynamicContent: undefined } );
		} );
	}

	// Merges updates into `dynamicContent.args`. A key set to `undefined` is
	// removed rather than persisted, so an unset argument leaves no trace in the
	// serialized attribute and the corresponding control reads as unset; `args`
	// itself is dropped once it is empty.
	function updateSourceArgs( updates ) {
		const nextArgs = { ...dynamicContent?.args, ...updates };
		Object.keys( updates ).forEach( ( key ) => {
			if ( nextArgs[ key ] === undefined ) {
				delete nextArgs[ key ];
			}
		} );
		const nextSource = { ...dynamicContent };
		if ( Object.keys( nextArgs ).length ) {
			nextSource.args = nextArgs;
		} else {
			delete nextSource.args;
		}
		setAttributes( { dynamicContent: nextSource } );
	}

	// Updates the source ordering. Passing `undefined` (or the default order)
	// strips the keys so they aren't persisted redundantly.
	function setSourceOrder( nextOrderby, nextOrder ) {
		const isDefault =
			nextOrderby === undefined ||
			( nextOrderby === DEFAULT_ORDERBY && nextOrder === DEFAULT_ORDER );
		updateSourceArgs(
			isDefault
				? { orderBy: undefined, order: undefined }
				: { orderBy: nextOrderby, order: nextOrder }
		);
	}

	// Points a media folder gallery at a folder. A falsy id clears the selection,
	// returning the block to its "choose a folder" empty state.
	function setSourceFolderId( folderId ) {
		updateSourceArgs( { folderId: folderId || undefined } );
	}

	// Resets the source's optional settings. Only the ordering is optional — the
	// source kind and the folder it points at are what the gallery *is*, so
	// clearing them would empty the block rather than reset a setting.
	function resetSource() {
		setSourceOrder( undefined, undefined );
	}

	return {
		dynamicContent,
		canUseDynamicSource,
		availableSources,
		enterableSources,
		sourceDescriptor,
		hasMoreImagesThanCap,
		dynamicMediaTotal,
		sourceOrderby,
		sourceOrder,
		sourceFolderId,
		setSourceFolderId,
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
