/**
 * The `editor` settings here need to be in sync with the corresponding ones in `editor` package.
 * See `packages/editor/src/components/media-categories/index.js`.
 *
 * In the future we could consider creating an Openvese package that can be used in both `editor` and `site-editor`.
 * The rest of the settings would still need to be in sync though.
 */
import { __, _n, sprintf, _x } from '@wordpress/i18n';
import { dispatch, resolveSelect, select, subscribe } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';

/** @typedef {import('@wordpress/block-editor').InserterMediaRequest} InserterMediaRequest */
/** @typedef {import('@wordpress/block-editor').InserterMediaItem} InserterMediaItem */
/** @typedef {import('@wordpress/block-editor').InserterMediaCategory} InserterMediaCategory */

const getExternalLink = ( url, text ) =>
	`<a ${ getExternalLinkAttributes( url ) }>${ text }</a>`;

const getExternalLinkAttributes = ( url ) =>
	`href="${ url }" target="_blank" rel="noopener"`;

const getOpenverseLicense = ( license, licenseVersion ) => {
	let licenseName = license.trim();
	// PDM has no abbreviation
	if ( license !== 'pdm' ) {
		licenseName = license.toUpperCase().replace( 'SAMPLING', 'Sampling' );
	}
	// If version is known, append version to the name.
	// The license has to have a version to be valid. Only
	// PDM (public domain mark) doesn't have a version.
	if ( licenseVersion ) {
		licenseName += ` ${ licenseVersion }`;
	}
	// For licenses other than public-domain marks, prepend 'CC' to the name.
	if ( ! [ 'pdm', 'cc0' ].includes( license ) ) {
		licenseName = `CC ${ licenseName }`;
	}
	return licenseName;
};

const getOpenverseCaption = ( item ) => {
	const {
		title,
		foreign_landing_url: foreignLandingUrl,
		creator,
		creator_url: creatorUrl,
		license,
		license_version: licenseVersion,
		license_url: licenseUrl,
	} = item;
	const fullLicense = getOpenverseLicense( license, licenseVersion );
	const _creator = decodeEntities( creator );
	let _caption;
	if ( _creator ) {
		_caption = title
			? sprintf(
					// translators: %1s: Title of a media work from Openverse; %2$s: Name of the work's creator; %3s: Work's licence e.g: "CC0 1.0".
					_x( '"%1$s" by %2$s/ %3$s', 'caption' ),
					getExternalLink(
						foreignLandingUrl,
						decodeEntities( title )
					),
					creatorUrl
						? getExternalLink( creatorUrl, _creator )
						: _creator,
					licenseUrl
						? getExternalLink(
								`${ licenseUrl }?ref=openverse`,
								fullLicense
						  )
						: fullLicense
			  )
			: sprintf(
					// translators: %1s: Link attributes for a given Openverse media work; %2s: Name of the work's creator; %3s: Works's licence e.g: "CC0 1.0".
					_x( '<a %1$s>Work</a> by %2$s/ %3$s', 'caption' ),
					getExternalLinkAttributes( foreignLandingUrl ),
					creatorUrl
						? getExternalLink( creatorUrl, _creator )
						: _creator,
					licenseUrl
						? getExternalLink(
								`${ licenseUrl }?ref=openverse`,
								fullLicense
						  )
						: fullLicense
			  );
	} else {
		_caption = title
			? sprintf(
					// translators: %1s: Title of a media work from Openverse; %2s: Work's licence e.g: "CC0 1.0".
					_x( '"%1$s"/ %2$s', 'caption' ),
					getExternalLink(
						foreignLandingUrl,
						decodeEntities( title )
					),
					licenseUrl
						? getExternalLink(
								`${ licenseUrl }?ref=openverse`,
								fullLicense
						  )
						: fullLicense
			  )
			: sprintf(
					// translators: %1s: Link attributes for a given Openverse media work; %2s: Works's licence e.g: "CC0 1.0".
					_x( '<a %1$s>Work</a>/ %2$s', 'caption' ),
					getExternalLinkAttributes( foreignLandingUrl ),
					licenseUrl
						? getExternalLink(
								`${ licenseUrl }?ref=openverse`,
								fullLicense
						  )
						: fullLicense
			  );
	}
	return _caption.replace( /\s{2}/g, ' ' );
};

const getCoreMediaQuery = ( query = {} ) => ( {
	...query,
	orderBy: !! query?.search ? 'relevance' : 'date',
} );

const coreMediaFetch = async ( query = {} ) => {
	// Use the same final query for the records fetch and the totals selectors so
	// their cached query key matches and the totals resolve to this exact request.
	const finalQuery = getCoreMediaQuery( query );
	const records = await resolveSelect( coreStore ).getEntityRecords(
		'postType',
		'attachment',
		finalQuery
	);
	// Totals are read synchronously after resolution — the `getEntityRecords`
	// resolver captures them from the `X-WP-Total` / `X-WP-TotalPages` response
	// headers, and `resolveSelect().getEntityRecords()` only returns the records.
	const totalItems = select( coreStore ).getEntityRecordsTotalItems(
		'postType',
		'attachment',
		finalQuery
	);
	const totalPages = select( coreStore ).getEntityRecordsTotalPages(
		'postType',
		'attachment',
		finalQuery
	);
	return {
		mediaItems: records.map( ( record ) => ( {
			...record,
			alt: record.alt_text,
			url: record.source_url,
			previewUrl: record.media_details?.sizes?.medium?.source_url,
			caption: record.caption?.raw,
		} ) ),
		totalItems,
		totalPages,
	};
};

const getAttachedImagesQuery = ( postId, query = {} ) => ( {
	...query,
	media_type: 'image',
	parent: postId,
} );

const normalizePostId = ( postId ) => {
	const parsedPostId = typeof postId === 'number' ? postId : Number( postId );

	return Number.isInteger( parsedPostId ) && parsedPostId > 0
		? parsedPostId
		: undefined;
};

const saveAttachmentParent = ( attachmentId, postId ) =>
	// `throwOnError` so a failed REST write rejects (rather than being silently
	// swallowed), letting the attach/detach handlers surface an error notice
	// instead of a false success.
	dispatch( coreStore ).saveEntityRecord(
		'postType',
		'attachment',
		{
			id: attachmentId,
			post: postId,
		},
		{ throwOnError: true }
	);

// A selected media item's coarse type is exposed differently by each picker.
// The classic media modal puts the media type directly on `type` (e.g. 'image').
// The DataViews-driven modal passes REST attachment records, where `type` is the
// *post* type ('attachment') and the media type lives in `media_type`
// ('image'|'file') / `mime_type`. So the REST fields must be read first, with
// `type` as the classic-modal fallback — otherwise a REST image reads as
// 'attachment' and gets gated out.
const getMediaItemType = ( mediaItem ) =>
	mediaItem?.media_type ||
	mediaItem?.mime_type?.split( '/' )[ 0 ] ||
	mediaItem?.type;

// The picker's "Upload files" tab accepts any file type, so the selection can
// include non-images. Gate to images only: a non-image would be reparented to
// the post but never appear in the image-filtered grid, and would wrongly count
// toward the "images attached" notice.
const getImageAttachmentIds = ( mediaItems ) => [
	...new Set(
		( Array.isArray( mediaItems ) ? mediaItems : [ mediaItems ] )
			.filter(
				( mediaItem ) => getMediaItemType( mediaItem ) === 'image'
			)
			.map( ( mediaItem ) => mediaItem?.id )
			.filter( Boolean )
	),
];

const invalidateAttachedImagesQueries = ( postId, query = {} ) => {
	const { invalidateResolution } = dispatch( coreStore );
	// Invalidate the resolution backing the visible grid so it refetches after
	// an attach/detach and reflects the updated set of attached images. The tab
	// is always shown (via `emptyMessage`), so there's no separate visibility
	// probe to invalidate.
	invalidateResolution( 'getEntityRecords', [
		'postType',
		'attachment',
		getCoreMediaQuery( getAttachedImagesQuery( postId, query ) ),
	] );
};

// The inserter panel fetches imperatively into local state, so it can't react to
// attachment cache invalidation on its own. Calls `onChange` on the resolved ->
// unresolved edge of the resolution the grid reads, i.e. when that cache is
// invalidated. `args` must match what `coreMediaFetch` resolves byte-for-byte,
// since `invalidateResolution` keys on deep argument equality.
const subscribeToMediaInvalidation = ( args, onChange ) => {
	const isResolved = () =>
		select( coreStore ).hasFinishedResolution( 'getEntityRecords', args );
	let wasResolved = isResolved();
	// Scoped to `coreStore` so the listener only runs on core-data changes.
	return subscribe( () => {
		const nowResolved = isResolved();
		if ( wasResolved && ! nowResolved ) {
			onChange();
		}
		wasResolved = nowResolved;
	}, coreStore );
};

// Builds a core-data-backed category from a single `getQuery` mapper, so `fetch`
// and `subscribe` can't drift apart on the resolution args. `coreMediaFetch`
// applies `getCoreMediaQuery` internally, so `subscribe` mirrors it. External
// sources (e.g. Openverse) don't use this and simply omit `subscribe`.
const createCoreMediaCategory = ( { getQuery, ...category } ) => ( {
	...category,
	async fetch( query = {} ) {
		return coreMediaFetch( getQuery( query ) );
	},
	subscribe( onChange, query = {} ) {
		return subscribeToMediaInvalidation(
			[
				'postType',
				'attachment',
				getCoreMediaQuery( getQuery( query ) ),
			],
			onChange
		);
	},
} );

/**
 * Copy for the "Attached images" source's attach/detach affordances. The shared
 * panel in `block-editor` renders whatever copy the source supplies, so the
 * post-type-specific wording is built here, where the post type is known.
 *
 * @param {string|null} [typeLabel] The post type's singular label (e.g. "Page"),
 *                                  or null to fall back to the generic "post".
 * @return {Object} The source's `attachCopy`.
 */
const getAttachedImagesCopy = ( typeLabel ) => ( {
	attachButton: __( 'Attach images' ),
	attachedNotice: ( count ) =>
		typeLabel
			? sprintf(
					/* translators: %1$d: Number of images attached. %2$s: Name of the post type e.g: "Page". */
					_n(
						'%1$d image attached to %2$s.',
						'%1$d images attached to %2$s.',
						count
					),
					count,
					typeLabel
			  )
			: sprintf(
					/* translators: %d: Number of images attached to the post. */
					_n(
						'%d image attached to post.',
						'%d images attached to post.',
						count
					),
					count
			  ),
	noneAttachedNotice: __( 'No images were attached.' ),
	attachErrorNotice: __( 'Could not attach images.' ),
	detachAction: typeLabel
		? sprintf(
				/* translators: %s: Name of the post type e.g: "Page". */
				__( 'Detach from %s' ),
				typeLabel
		  )
		: __( 'Detach from post' ),
	detachModalTitle: __( 'Detach image' ),
	detachModalBody: typeLabel
		? sprintf(
				/* translators: %s: Name of the post type e.g: "Page". */
				__(
					'Detach this image from the current %s? The image will remain in the Media Library.'
				),
				typeLabel
		  )
		: __(
				'Detach this image from the current post? The image will remain in the Media Library.'
		  ),
	detachConfirmButton: __( 'Detach' ),
	detachedNotice: typeLabel
		? sprintf(
				/* translators: %s: Name of the post type e.g: "Page". */
				__( 'Image detached from %s.' ),
				typeLabel
		  )
		: __( 'Image detached from post.' ),
	detachErrorNotice: __( 'Could not detach image.' ),
} );

/**
 * Builds the "Attachments" media category for a given post. It behaves like
 * any other inserter media source (e.g. Openverse): it appears in the tab list
 * and renders through the shared media panel. In addition to `fetch`, it exposes
 * optional `attach`/`detach`/`invalidate` capabilities that the shared panel
 * picks up to offer an "Attach images" button and a per-item "Detach from post"
 * action in the same dropdown Openverse uses for "Report image". It also exposes
 * `subscribe`, so the panel can refetch when the attachment cache is invalidated
 * elsewhere (e.g. a media modal closing after an upload).
 *
 * @param {number}      postId      The current post id.
 * @param {string|null} [typeLabel] The post type's singular label to use in copy (e.g. "Page"),
 *                                  or null to fall back to the generic "post".
 * @return {InserterMediaCategory} The Attachments media category.
 */
const getAttachedImagesCategory = ( postId, typeLabel ) =>
	createCoreMediaCategory( {
		name: 'attached-images',
		labels: {
			name: __( 'Attached images' ),
			search_items: __( 'Search attachments' ),
		},
		mediaType: 'image',
		getQuery: ( query ) => getAttachedImagesQuery( postId, query ),
		attachCopy: getAttachedImagesCopy( typeLabel ),
		// Empty-state message. Providing this also keeps the source in the tab
		// list when it has no items, so it stays discoverable and the first
		// image can be attached even with none yet.
		emptyMessage: typeLabel
			? sprintf(
					// translators: %s: Name of the post type e.g: "Page".
					__( 'No images attached to this %s.' ),
					typeLabel
			  )
			: __( 'No images attached to this post.' ),
		async attach( mediaItems ) {
			const attachmentIds = getImageAttachmentIds( mediaItems );

			await Promise.all(
				attachmentIds.map( ( attachmentId ) =>
					saveAttachmentParent( attachmentId, postId )
				)
			);

			return attachmentIds.length;
		},
		async detach( mediaItem ) {
			await saveAttachmentParent( mediaItem.id, 0 );
		},
		invalidate( query = {} ) {
			invalidateAttachedImagesQueries( postId, query );
		},
	} );

/**
 * The media folders taxonomy's REST base. It names both the `/wp/v2/media`
 * collection parameter used to filter attachments by folder and the field on an
 * attachment record holding its folder ids — `WP_REST_Posts_Controller` derives
 * both from `rest_base`, so the hyphenated form is correct in a REST context
 * even though the taxonomy itself is `wp_media_folder`.
 */
const MEDIA_FOLDER_REST_BASE = 'media-folders';

const getMediaFolderQuery = ( folderId, query = {} ) => ( {
	...query,
	media_type: 'image',
	[ MEDIA_FOLDER_REST_BASE ]: [ folderId ],
} );

/**
 * Reads an attachment's current folder ids straight from the REST record.
 *
 * Folder assignment is many-to-many, and saving the taxonomy field *replaces*
 * the whole set — so adding or removing one folder means reading the current set
 * first and writing the union/difference. The record is read here rather than
 * taken from the caller's media item because selections coming from the media
 * picker are not guaranteed to carry the taxonomy field.
 *
 * @param {number} attachmentId The attachment id.
 * @return {Promise<number[]>} The attachment's current folder ids.
 */
const getAttachmentFolderIds = async ( attachmentId ) => {
	const record = await resolveSelect( coreStore ).getEntityRecord(
		'postType',
		'attachment',
		attachmentId
	);
	const folderIds = record?.[ MEDIA_FOLDER_REST_BASE ];
	return Array.isArray( folderIds ) ? folderIds : [];
};

const saveAttachmentFolderIds = ( attachmentId, folderIds ) =>
	// `throwOnError` so a failed REST write rejects rather than being silently
	// swallowed, letting the panel surface an error notice (see
	// `saveAttachmentParent`).
	dispatch( coreStore ).saveEntityRecord(
		'postType',
		'attachment',
		{
			id: attachmentId,
			[ MEDIA_FOLDER_REST_BASE ]: folderIds,
		},
		{ throwOnError: true }
	);

/**
 * Copy for a folder source's attach/detach affordances, worded around the
 * folder's own name. Mirrors `getAttachedImagesCopy`.
 *
 * @param {string} folderName The folder's (decoded) name.
 * @return {Object} The source's `attachCopy`.
 */
const getMediaFolderCopy = ( folderName ) => ( {
	attachButton: __( 'Add images to folder' ),
	attachedNotice: ( count ) =>
		sprintf(
			/* translators: %1$d: Number of images added. %2$s: Name of the folder. */
			_n(
				'%1$d image added to %2$s.',
				'%1$d images added to %2$s.',
				count
			),
			count,
			folderName
		),
	noneAttachedNotice: __( 'No images were added.' ),
	attachErrorNotice: __( 'Could not add images to the folder.' ),
	detachAction: __( 'Remove from folder' ),
	detachModalTitle: __( 'Remove image from folder' ),
	detachModalBody: sprintf(
		/* translators: %s: Name of the folder. */
		__(
			'Remove this image from %s? The image will remain in the Media Library.'
		),
		folderName
	),
	detachConfirmButton: __( 'Remove' ),
	detachedNotice: sprintf(
		/* translators: %s: Name of the folder. */
		__( 'Image removed from %s.' ),
		folderName
	),
	detachErrorNotice: __( 'Could not remove image from the folder.' ),
} );

/**
 * Builds a media category for a single media folder (a `wp_media_folder` term).
 *
 * Structurally identical to the "Attached images" category — it renders through
 * the same shared panel, gets pagination for free from `coreMediaFetch`, and
 * exposes the same `attach`/`detach`/`invalidate`/`subscribe` capabilities — but
 * membership is a taxonomy term rather than the attachment's parent post. That
 * means a folder is not tied to the edited post, so these categories are offered
 * everywhere the media tab appears.
 *
 * @param {Object} term The folder term record from `/wp/v2/media-folders`.
 * @return {InserterMediaCategory} The folder's media category.
 */
const getMediaFolderCategory = ( term ) => {
	const folderId = term.id;
	const folderName = decodeEntities( term.name );

	return createCoreMediaCategory( {
		// Namespaced so a folder can never collide with a built-in source name.
		name: `media-folder-${ folderId }`,
		labels: {
			name: folderName,
			search_items: __( 'Search images' ),
		},
		mediaType: 'image',
		getQuery: ( query ) => getMediaFolderQuery( folderId, query ),
		folderId,
		attachCopy: getMediaFolderCopy( folderName ),
		// As with "Attached images", this both supplies the empty-state copy and
		// keeps the folder in the tab list while it is empty — which is what
		// makes a brand new folder reachable so images can be added to it.
		emptyMessage: __( 'No images in this folder.' ),
		async attach( mediaItems ) {
			const attachmentIds = getImageAttachmentIds( mediaItems );

			await Promise.all(
				attachmentIds.map( async ( attachmentId ) => {
					const folderIds =
						await getAttachmentFolderIds( attachmentId );
					// Already in this folder: skip the write rather than
					// re-saving an unchanged set. The image still counts toward
					// the notice below, which reports what the selection put in
					// the folder, not how many rows changed.
					if ( folderIds.includes( folderId ) ) {
						return;
					}
					await saveAttachmentFolderIds( attachmentId, [
						...folderIds,
						folderId,
					] );
				} )
			);

			return attachmentIds.length;
		},
		async detach( mediaItem ) {
			const folderIds = await getAttachmentFolderIds( mediaItem.id );
			await saveAttachmentFolderIds(
				mediaItem.id,
				folderIds.filter( ( id ) => id !== folderId )
			);
		},
		invalidate( query = {} ) {
			dispatch( coreStore ).invalidateResolution( 'getEntityRecords', [
				'postType',
				'attachment',
				getCoreMediaQuery( getMediaFolderQuery( folderId, query ) ),
			] );
		},
	} );
};

/** @type {InserterMediaCategory[]} */
const inserterMediaCategories = [
	createCoreMediaCategory( {
		name: 'images',
		labels: {
			name: __( 'Images' ),
			search_items: __( 'Search images' ),
		},
		mediaType: 'image',
		getQuery: ( query ) => ( { ...query, media_type: 'image' } ),
	} ),
	createCoreMediaCategory( {
		name: 'videos',
		labels: {
			name: __( 'Videos' ),
			search_items: __( 'Search videos' ),
		},
		mediaType: 'video',
		getQuery: ( query ) => ( { ...query, media_type: 'video' } ),
	} ),
	createCoreMediaCategory( {
		name: 'audio',
		labels: {
			name: __( 'Audio' ),
			search_items: __( 'Search audio' ),
		},
		mediaType: 'audio',
		getQuery: ( query ) => ( { ...query, media_type: 'audio' } ),
	} ),
	{
		name: 'openverse',
		labels: {
			name: __( 'Openverse' ),
			search_items: __( 'Search Openverse' ),
		},
		mediaType: 'image',
		async fetch( query = {} ) {
			const defaultArgs = {
				mature: false,
				excluded_source: 'flickr,inaturalist,wikimedia',
				license: 'pdm,cc0',
			};
			const finalQuery = { ...query, ...defaultArgs };
			const mapFromInserterMediaRequest = {
				per_page: 'page_size',
				search: 'q',
			};
			const url = new URL( 'https://api.openverse.org/v1/images/' );
			Object.entries( finalQuery ).forEach( ( [ key, value ] ) => {
				const queryKey = mapFromInserterMediaRequest[ key ] || key;
				url.searchParams.set( queryKey, value );
			} );
			const response = await window.fetch( url, {
				headers: {
					'User-Agent': 'WordPress/inserter-media-fetch',
				},
			} );
			const jsonResponse = await response.json();
			const results = jsonResponse.results;
			// This external source returns a plain array, so it renders without a
			// pager (the shared panel treats a non-object result as a single
			// page). To paginate it later, return the same
			// `{ mediaItems, totalItems, totalPages }` shape the core sources use,
			// mapping `jsonResponse.result_count` -> `totalItems` and
			// `jsonResponse.page_count` -> `totalPages` (Openverse already accepts
			// a `page` query arg, which passes straight through above).
			return results.map( ( result ) => ( {
				...result,
				// This is a temp solution for better titles, until Openverse API
				// completes the cleaning up of some titles of their upstream data.
				title: result.title?.toLowerCase().startsWith( 'file:' )
					? result.title.slice( 5 )
					: result.title,
				sourceId: result.id,
				id: undefined,
				caption: getOpenverseCaption( result ),
				previewUrl: result.thumbnail,
			} ) );
		},
		getReportUrl: ( { sourceId } ) =>
			`https://wordpress.org/openverse/image/${ sourceId }/report/`,
		isExternalResource: true,
	},
];

/**
 * Returns the inserter media categories for a given post. The "Attachments"
 * category is prepended only when editing real, front-end-rendered content
 * (posts, pages, public custom post types). It is omitted for synced patterns,
 * navigation menus and templates, which aren't the entity that actually gets
 * rendered, so attaching media to them is meaningless.
 *
 * Media folders, in contrast, aren't tied to the edited entity, so a category is
 * appended for each folder regardless of what is being edited. The list is empty
 * unless the media folders experiment is on (the taxonomy is only registered
 * then, so it resolves to nothing).
 *
 * @param {number|string} postId                  The current post id.
 * @param {string}        [viewablePostTypeLabel] Singular label of the post type, set only when it is front-end viewable (post, page, public CPT).
 * @param {Object[]}      [mediaFolders]          The `wp_media_folder` term records.
 * @return {InserterMediaCategory[]} The inserter media categories.
 */
export default function getInserterMediaCategories(
	postId,
	viewablePostTypeLabel,
	mediaFolders
) {
	const folderCategories = ( mediaFolders ?? [] ).map(
		getMediaFolderCategory
	);
	const currentPostId = normalizePostId( postId );

	// A falsy label means either a non-viewable post type (synced pattern,
	// navigation, template) or that the record hasn't resolved yet — in both
	// cases the category is omitted. A numeric id is also required since it
	// backs the attachment `parent` query.
	if ( ! currentPostId || ! viewablePostTypeLabel ) {
		return [ ...inserterMediaCategories, ...folderCategories ];
	}

	return [
		getAttachedImagesCategory( currentPostId, viewablePostTypeLabel ),
		...inserterMediaCategories,
		...folderCategories,
	];
}
