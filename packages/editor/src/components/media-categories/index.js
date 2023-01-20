/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as coreStore } from '@wordpress/core-data';

/** @typedef {import('@wordpress/block-editor').InserterMediaRequest} InserterMediaRequest */
/** @typedef {import('@wordpress/block-editor').InserterMediaItem} InserterMediaItem */
/**
 * Interface for inserter media category.
 *
 * @typedef {Object} InserterMediaCategory
 * @property {string}                                                 label                The label of the media category. It's used in the inserter media items list.
 * @property {string}                                                 [searchLabel]        The label to append in the search placeholder. If not provided the lowercase `label` will be used.
 * @property {string}                                                 name                 The name of the media category, that should be unique among all media categories.
 * @property {('image'|'audio'|'video')}                              mediaType            The media type of the media category.
 * @property {(InserterMediaRequest) => Promise<InserterMediaItem[]>} fetch                The function to fetch media items for the category.
 * @property {(InserterMediaItem) => string}                          [getReportUrl]       If the media category supports reporting media items, this function should return
 *                                                                                         the report url for the media item. It accepts the `InserterMediaItem` as an argument.
 * @property {boolean}                                                [isExternalResource] If the media category is an external resource, this should be set to true.
 *                                                                                         This is used to avoid making a request to the external resource when the user
 *                                                                                         opens the inserter for the first time.
 */

const getExternalLink = ( url, text ) =>
	`<a href="${ url }" target="_blank" rel="noreferrer noopener">${ text }</a>`;

const getOpenverseLicense = ( license, licenseVersion, licenseUrl ) => {
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
	if ( !! licenseUrl ) {
		license = getExternalLink(
			`${ licenseUrl }?ref=openverse`,
			licenseName
		);
	}
	return license;
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
	/* translators: Openverse default media item title in the block inserter's media list. (ex. 'This work by {creator} is marked with CC0 1.0'). */
	const defaultTitle = __( 'This work' );
	let _title = title ? decodeEntities( title ) : defaultTitle;
	_title = getExternalLink( foreignLandingUrl, _title );
	const fullLicense = getOpenverseLicense(
		license,
		licenseVersion,
		licenseUrl
	);
	let _creator = decodeEntities( creator );
	if ( creatorUrl ) {
		_creator = getExternalLink( creatorUrl, creator );
	}
	_creator = sprintf(
		/* translators: %s: Name of the media's creator. */
		__( ' by %s' ),
		_creator
	);
	const caption = `"${ _title }" ${ _creator }/ ${ fullLicense }.`;
	return caption.replace( /\s{2}/g, ' ' );
};

const coreMediaFetch = async ( query = {} ) => {
	const mediaItems = await resolveSelect( coreStore ).getMediaItems( {
		...query,
		orderBy: !! query?.search ? 'relevance' : 'date',
	} );
	return mediaItems.map( ( mediaItem ) => ( {
		...mediaItem,
		alt: mediaItem.alt_text,
		url: mediaItem.source_url,
		previewUrl: mediaItem.media_details?.sizes?.medium?.source_url,
		caption: mediaItem.caption?.raw,
	} ) );
};

/** @type {InserterMediaCategory[]} */
const inserterMediaCategories = [
	{
		label: __( 'Images' ),
		name: 'images',
		mediaType: 'image',
		async fetch( query = {} ) {
			return coreMediaFetch( { ...query, media_type: 'image' } );
		},
	},
	{
		label: __( 'Videos' ),
		name: 'videos',
		mediaType: 'video',
		async fetch( query = {} ) {
			return coreMediaFetch( { ...query, media_type: 'video' } );
		},
	},
	{
		label: __( 'Audio' ),
		name: 'audio',
		mediaType: 'audio',
		async fetch( query = {} ) {
			return coreMediaFetch( { ...query, media_type: 'audio' } );
		},
	},
	{
		label: __( 'Openverse' ),
		searchLabel: __( 'Openverse' ),
		name: 'openverse',
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
			const url = new URL(
				'https://api.openverse.engineering/v1/images/'
			);
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

export default inserterMediaCategories;
