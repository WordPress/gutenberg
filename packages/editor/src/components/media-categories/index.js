/**
 * The `editor` settings here need to be in sync with the corresponding ones in `editor` package.
 * See `packages/editor/src/components/media-categories/index.js`.
 *
 * In the future we could consider creating an Openvese package that can be used in both `editor` and `site-editor`.
 * The rest of the settings would still need to be in sync though.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf, _x } from '@wordpress/i18n';
import { dispatch, resolveSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
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
	const mediaItems = await resolveSelect( coreStore ).getEntityRecords(
		'postType',
		'attachment',
		getCoreMediaQuery( query )
	);
	return mediaItems.map( ( mediaItem ) => ( {
		...mediaItem,
		alt: mediaItem.alt_text,
		url: mediaItem.source_url,
		previewUrl: mediaItem.media_details?.sizes?.medium?.source_url,
		caption: mediaItem.caption?.raw,
	} ) );
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

/**
 * Builds the "Attachments" media category for a given post. It behaves like
 * any other inserter media source (e.g. Openverse): it appears in the tab list
 * and renders through the shared media panel. In addition to `fetch`, it exposes
 * optional `attach`/`detach`/`invalidate` capabilities that the shared panel
 * picks up to offer an "Attach images" button and a per-item "Detach from post"
 * action in the same dropdown Openverse uses for "Report image".
 *
 * @param {number}      postId      The current post id.
 * @param {string|null} [typeLabel] The post type's singular label to use in copy (e.g. "Page"),
 *                                  or null to fall back to the generic "post".
 * @return {InserterMediaCategory} The Attachments media category.
 */
const getAttachedImagesCategory = ( postId, typeLabel ) => ( {
	name: 'attached-images',
	labels: {
		name: __( 'Attached images' ),
		search_items: __( 'Search attachments' ),
	},
	mediaType: 'image',
	// The post type's singular label (e.g. "Page"), threaded through so the
	// shared panel can word its attach/detach copy for the current post type.
	postTypeLabel: typeLabel,
	// Empty-state message. Providing this also keeps the source in the tab list
	// when it has no items, so it stays discoverable and the first image can be
	// attached even with none yet.
	emptyMessage: typeLabel
		? sprintf(
				// translators: %s: Name of the post type e.g: "Page".
				__( 'No images attached to this %s.' ),
				typeLabel
		  )
		: __( 'No images attached to this post.' ),
	async fetch( query = {} ) {
		return coreMediaFetch( getAttachedImagesQuery( postId, query ) );
	},
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

/** @type {InserterMediaCategory[]} */
const inserterMediaCategories = [
	{
		name: 'images',
		labels: {
			name: __( 'Images' ),
			search_items: __( 'Search images' ),
		},
		mediaType: 'image',
		async fetch( query = {} ) {
			return coreMediaFetch( { ...query, media_type: 'image' } );
		},
	},
	{
		name: 'videos',
		labels: {
			name: __( 'Videos' ),
			search_items: __( 'Search videos' ),
		},
		mediaType: 'video',
		async fetch( query = {} ) {
			return coreMediaFetch( { ...query, media_type: 'video' } );
		},
	},
	{
		name: 'audio',
		labels: {
			name: __( 'Audio' ),
			search_items: __( 'Search audio' ),
		},
		mediaType: 'audio',
		async fetch( query = {} ) {
			return coreMediaFetch( { ...query, media_type: 'audio' } );
		},
	},
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
