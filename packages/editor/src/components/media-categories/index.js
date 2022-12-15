/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as coreStore } from '@wordpress/core-data';

const getExternalLink = ( url, text ) =>
	`<a href="${ url }" target="_blank" rel="noreferrer noopener">${ text }</a>`;

const getOpenvereLicense = (
	license,
	licenseVersion = '', // unknown version.
	licenseUrl
) => {
	let licenseName = license.trim();
	// PDM has no abbreviation
	if ( license !== 'pdm' ) {
		licenseName = license.toUpperCase().replace( 'SAMPLING', 'Sampling' );
	}
	// If version is known, append version to the name.
	if ( licenseVersion ) {
		licenseName += ` ${ licenseVersion }`;
	}
	// For licenses other than public-domain marks, prepend 'CC' to the name.
	const isPublicDomainMark = [ 'pdm', 'cc0' ].includes( license );
	if ( ! isPublicDomainMark ) {
		licenseName = `CC ${ licenseName }`;
	}
	if ( !! licenseUrl ) {
		license = getExternalLink(
			`${ licenseUrl }?ref=openverse`,
			licenseName
		);
	}
	// TODO: add translators comment.
	const markedLicence = isPublicDomainMark
		? __( 'is marked with' )
		: __( 'is licensed under' );
	return `${ markedLicence } ${ license }`;
};

const getOpenverseCaption = ( item ) => {
	const {
		title = __( 'This work' ), // TODO: add translators comment.
		foreign_landing_url: foreignLandingUrl,
		creator,
		creator_url: creatorUrl,
		license,
		license_version: licenseVersion,
		license_url: licenseUrl,
	} = item;
	let _title = decodeEntities( title );
	if ( !! foreignLandingUrl ) {
		_title = getExternalLink( foreignLandingUrl, _title );
	}
	const fullLicense = getOpenvereLicense(
		license,
		licenseVersion,
		licenseUrl
	);
	let _creator = decodeEntities( creator );
	if ( creatorUrl ) {
		_creator = getExternalLink( creatorUrl, creator );
	}
	_creator = ` ${ __( 'by' ) } ${ _creator }`; // TODO: add translators comment.
	const caption = `"${ _title }" ${ _creator } ${ fullLicense }.`;
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
		caption: mediaItem.caption?.raw,
	} ) );
};

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
		label: 'Openverse',
		name: 'openverse',
		mediaType: 'image',
		async fetch( query = {} ) {
			const defaultArgs = {
				mature: false,
				excluded_source: 'flickr',
				license: 'cc0',
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
			const response = await window.fetch( url );
			const jsonResponse = await response.json();
			const results = jsonResponse.results;
			return results.map( ( result ) => ( {
				...result,
				sourceId: result.id,
				id: undefined,
				caption: getOpenverseCaption( result ),
			} ) );
		},
		hasAvailableMedia: true,
	},
];

export default inserterMediaCategories;
