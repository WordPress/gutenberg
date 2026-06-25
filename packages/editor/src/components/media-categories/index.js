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
import { dispatch, resolveSelect, select } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as coreStore } from '@wordpress/core-data';

/** @typedef {import('@wordpress/block-editor').InserterMediaRequest} InserterMediaRequest */
/** @typedef {import('@wordpress/block-editor').InserterMediaItem} InserterMediaItem */
/** @typedef {import('@wordpress/block-editor').InserterMediaCategory} InserterMediaCategory */

const ATTACHED_IMAGES_PANEL_ITEM_COUNT = 20;

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
	return ( mediaItems || [] ).map( ( mediaItem ) => ( {
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
	dispatch( coreStore ).saveEntityRecord( 'postType', 'attachment', {
		id: attachmentId,
		post: postId,
	} );

const getAttachmentIds = ( mediaItems ) => [
	...new Set(
		( Array.isArray( mediaItems ) ? mediaItems : [ mediaItems ] )
			.map( ( mediaItem ) => mediaItem?.id )
			.filter( Boolean )
	),
];

const invalidateAttachedImagesQueries = ( postId, query = {} ) => {
	const { invalidateResolution } = dispatch( coreStore );
	const queries = [
		query,
		{ per_page: 1 },
		{ per_page: ATTACHED_IMAGES_PANEL_ITEM_COUNT },
	];

	for ( const attachedImagesQuery of queries ) {
		invalidateResolution( 'getEntityRecords', [
			'postType',
			'attachment',
			getCoreMediaQuery(
				getAttachedImagesQuery( postId, attachedImagesQuery )
			),
		] );
	}
};

/**
 * Builds the "attached images" inserter media category for the current post.
 *
 * Beyond the standard category shape (`name`, `labels`, `mediaType`, `fetch`),
 * this returns a self-contained behaviour bundle: `attach`, `detach`,
 * `invalidate`, and `getTotalItems`, plus the `isCurrentPostMedia` flag that
 * routes it to the dedicated panel in `block-editor`. All of the
 * WordPress-attachment-specific logic (querying by `parent`, saving the `post`
 * field) is encapsulated here so `block-editor` can host the panel without
 * knowing anything about attachments. The capability is opt-in: categories that
 * don't set `isCurrentPostMedia` (e.g. Images, Openverse) are unaffected.
 *
 * @param {number} postId The current post ID.
 * @return {Object} The attached-images inserter media category.
 */
const getAttachedImagesCategory = ( postId ) => ( {
	name: 'attached-images',
	labels: {
		name: __( 'Attached images' ),
		search_items: __( 'Search attached images' ),
	},
	mediaType: 'image',
	isCurrentPostMedia: true,
	showIfEmpty: true,
	async fetch( query = {} ) {
		return coreMediaFetch( getAttachedImagesQuery( postId, query ) );
	},
	getTotalItems( query = {} ) {
		return select( coreStore ).getEntityRecordsTotalItems(
			'postType',
			'attachment',
			getCoreMediaQuery( getAttachedImagesQuery( postId, query ) )
		);
	},
	async attach( mediaItems ) {
		const attachmentIds = getAttachmentIds( mediaItems );

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
const coreInserterMediaCategories = [
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

export default function getInserterMediaCategories( postId ) {
	const currentPostId = normalizePostId( postId );

	if ( ! currentPostId ) {
		return coreInserterMediaCategories;
	}

	return [
		getAttachedImagesCategory( currentPostId ),
		...coreInserterMediaCategories,
	];
}
