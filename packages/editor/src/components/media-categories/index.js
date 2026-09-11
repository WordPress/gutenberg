/**
 * The `editor` settings here need to be in sync with the corresponding ones in `editor` package.
 * See `packages/editor/src/components/media-categories/index.js`.
 *
 * In the future we could consider creating an Openvese package that can be used in both `editor` and `site-editor`.
 * The rest of the settings would still need to be in sync though.
 */
import { __, sprintf, _x } from '@wordpress/i18n';
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

/**
 * The media folders taxonomy's REST base. It names both the `/wp/v2/media`
 * collection parameter used to filter attachments by folder and the field on an
 * attachment record holding its folder ids — `WP_REST_Posts_Controller` derives
 * both from `rest_base`, so the hyphenated form is correct in a REST context
 * even though the taxonomy itself is `wp_media_folder`.
 */
const MEDIA_FOLDER_REST_BASE = 'media-folders';

// Behind the `gutenberg-media-folders` experiment, which is what registers the
// taxonomy. Read at call time (not module load) so the categories can be built
// either way in the same session, e.g. in tests.
const isMediaFoldersEnabled = () =>
	typeof window !== 'undefined' && !! window.__experimentalMediaFolders;

/**
 * Maps the inserter request's `folder` (a `wp_media_folder` term id, set by the
 * panel's folder filter) onto the REST collection parameter, and strips it
 * otherwise so it never reaches the endpoint as an unknown arg.
 *
 * @param {Object} query The inserter media request.
 * @return {Object} The query with the folder expressed as a taxonomy filter.
 */
const withFolderQuery = ( query ) => {
	const { folder, ...restQuery } = query;
	return folder
		? { ...restQuery, [ MEDIA_FOLDER_REST_BASE ]: [ folder ] }
		: restQuery;
};

const getAttachedImagesQuery = ( postId, query = {} ) =>
	withFolderQuery( {
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
// include other types. Gate to the source's own media type: an item of another
// type would be filed or reparented but never appear in the type-filtered grid,
// and would wrongly count toward the notice.
const getMediaAttachmentIds = ( mediaItems, mediaType ) => [
	...new Set(
		( Array.isArray( mediaItems ) ? mediaItems : [ mediaItems ] )
			.filter(
				( mediaItem ) => getMediaItemType( mediaItem ) === mediaType
			)
			.map( ( mediaItem ) => mediaItem?.id )
			.filter( Boolean )
	),
];

const getImageAttachmentIds = ( mediaItems ) =>
	getMediaAttachmentIds( mediaItems, 'image' );

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
 * The folder capabilities a core (attachment-backed) source exposes to the
 * inserter panel while the media folders experiment is on:
 *
 * - `supportsFolders` tells the panel to offer the folder filter.
 * - `assignToFolder` files the given media items (of the source's type) into a
 *   folder, keeping whatever other folders they are already in, and returns how
 *   many were filed.
 * - `removeFromFolder` takes one item out of a folder, leaving its other
 *   folders alone.
 *
 * @param {string} mediaType The source's media type, used to gate selections.
 * @return {Object} The capabilities to spread onto the category.
 */
const getFolderCapabilities = ( mediaType ) => ( {
	supportsFolders: true,
	async assignToFolder( mediaItems, folderId ) {
		const attachmentIds = getMediaAttachmentIds( mediaItems, mediaType );

		await Promise.all(
			attachmentIds.map( async ( attachmentId ) => {
				const folderIds = await getAttachmentFolderIds( attachmentId );
				// Already in this folder: skip the write rather than re-saving
				// an unchanged set. The item still counts toward the notice,
				// which reports what the selection put in the folder, not how
				// many rows changed.
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
	async removeFromFolder( mediaItem, folderId ) {
		const folderIds = await getAttachmentFolderIds( mediaItem.id );
		await saveAttachmentFolderIds(
			mediaItem.id,
			folderIds.filter( ( id ) => id !== folderId )
		);
	},
} );

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

// Builds a core-data-backed category from a single `getQuery` mapper, so
// `fetch`, `subscribe` and `invalidate` can't drift apart on the resolution
// args. `coreMediaFetch` applies `getCoreMediaQuery` internally, so the other
// two mirror it. External sources (e.g. Openverse) don't use this and simply
// omit them. With the media folders experiment on, every core source also gets
// the folder capabilities.
const createCoreMediaCategory = ( { getQuery, ...category } ) => ( {
	...category,
	...( isMediaFoldersEnabled()
		? getFolderCapabilities( category.mediaType )
		: {} ),
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
	// Invalidate the resolution backing the visible grid so it refetches after
	// an attach/detach or a folder change and reflects the updated set.
	invalidate( query = {} ) {
		dispatch( coreStore ).invalidateResolution( 'getEntityRecords', [
			'postType',
			'attachment',
			getCoreMediaQuery( getQuery( query ) ),
		] );
	},
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
		// The post type's singular label (e.g. "Page"), threaded through so the
		// shared panel can word its attach/detach copy for the current post type.
		postTypeLabel: typeLabel,
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
	} );

const getMediaTypeQuery = ( mediaType, query = {} ) =>
	withFolderQuery( { ...query, media_type: mediaType } );

// Built per call (rather than once at module load) so the folder capabilities
// reflect the experiment flag at the time the categories are requested.
const getInserterMediaCategoriesList = () => [
	createCoreMediaCategory( {
		name: 'images',
		labels: {
			name: __( 'Images' ),
			search_items: __( 'Search images' ),
		},
		mediaType: 'image',
		getQuery: ( query ) => getMediaTypeQuery( 'image', query ),
	} ),
	createCoreMediaCategory( {
		name: 'videos',
		labels: {
			name: __( 'Videos' ),
			search_items: __( 'Search videos' ),
		},
		mediaType: 'video',
		getQuery: ( query ) => getMediaTypeQuery( 'video', query ),
	} ),
	createCoreMediaCategory( {
		name: 'audio',
		labels: {
			name: __( 'Audio' ),
			search_items: __( 'Search audio' ),
		},
		mediaType: 'audio',
		getQuery: ( query ) => getMediaTypeQuery( 'audio', query ),
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
 * @param {number|string} postId                  The current post id.
 * @param {string}        [viewablePostTypeLabel] Singular label of the post type, set only when it is front-end viewable (post, page, public CPT).
 * @return {InserterMediaCategory[]} The inserter media categories.
 */
export default function getInserterMediaCategories(
	postId,
	viewablePostTypeLabel
) {
	const currentPostId = normalizePostId( postId );
	const inserterMediaCategories = getInserterMediaCategoriesList();

	// A falsy label means either a non-viewable post type (synced pattern,
	// navigation, template) or that the record hasn't resolved yet — in both
	// cases the category is omitted. A numeric id is also required since it
	// backs the attachment `parent` query.
	if ( ! currentPostId || ! viewablePostTypeLabel ) {
		return inserterMediaCategories;
	}

	return [
		getAttachedImagesCategory( currentPostId, viewablePostTypeLabel ),
		...inserterMediaCategories,
	];
}
