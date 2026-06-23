/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef, useMemo } from '@wordpress/element';
import { __, sprintf, _x } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

const getExternalLink = ( url, text ) =>
	`<a ${ getExternalLinkAttributes( url ) }>${ text }</a>`;

const getExternalLinkAttributes = ( url ) =>
	`href="${ url }" target="_blank" rel="noreferrer noopener"`;

const getOpenverseLicense = ( license, licenseVersion ) => {
	let licenseName = license.trim();
	if ( license !== 'pdm' ) {
		licenseName = license.toUpperCase().replace( 'SAMPLING', 'Sampling' );
	}
	if ( licenseVersion ) {
		licenseName += ` ${ licenseVersion }`;
	}
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

/**
 * Normalizes an Openverse API result into the common item shape
 * used by the DataViews-based inserter media panel.
 *
 * @param {Object} result Raw Openverse API result.
 * @return {Object} Normalized media item.
 */
function normalizeOpenverseResult( result ) {
	const title = result.title?.toLowerCase().startsWith( 'file:' )
		? result.title.slice( 5 )
		: result.title;

	return {
		id: `openverse-${ result.id }`,
		title: title || __( '(no title)' ),
		thumbnailUrl: result.thumbnail,
		url: result.url,
		mediaType: 'image',
		alt: title,
		caption: getOpenverseCaption( result ),
		source: 'openverse',
		sourceId: result.id,
		isExternalResource: true,
		reportUrl: `https://wordpress.org/openverse/image/${ result.id }/report/`,
		_raw: result,
	};
}

const OPENVERSE_DEFAULT_ARGS = {
	mature: false,
	excluded_source: 'flickr,inaturalist,wikimedia',
	license: 'pdm,cc0',
};

/**
 * Hook that fetches Openverse results and returns them in a
 * DataViews-compatible format with pagination info.
 *
 * @param {Object}  options           Query options.
 * @param {string}  options.search    Search term.
 * @param {number}  options.page      Current page (1-indexed).
 * @param {number}  options.perPage   Items per page.
 * @param {boolean} options.isEnabled Whether to fetch results.
 * @return {Object} DataViews-compatible result with data, totalItems, totalPages, isLoading.
 */
export default function useOpenverseResults( {
	search = '',
	page = 1,
	perPage = 20,
	isEnabled = true,
} ) {
	const [ data, setData ] = useState( [] );
	const [ totalItems, setTotalItems ] = useState( 0 );
	const [ totalPages, setTotalPages ] = useState( 0 );
	const [ isLoading, setIsLoading ] = useState( false );
	const lastRequestRef = useRef( 0 );

	useEffect( () => {
		if ( ! isEnabled ) {
			setData( [] );
			setTotalItems( 0 );
			setTotalPages( 0 );
			return;
		}

		const requestId = ++lastRequestRef.current;
		setIsLoading( true );

		const url = new URL( 'https://api.openverse.org/v1/images/' );
		const queryParams = {
			...OPENVERSE_DEFAULT_ARGS,
			q: search,
			page_size: perPage,
			page,
		};

		Object.entries( queryParams ).forEach( ( [ key, value ] ) => {
			if ( value !== undefined && value !== '' ) {
				url.searchParams.set( key, value );
			}
		} );

		window
			.fetch( url, {
				headers: {
					'User-Agent': 'WordPress/inserter-media-fetch',
				},
			} )
			.then( ( response ) => response.json() )
			.then( ( jsonResponse ) => {
				if ( requestId !== lastRequestRef.current ) {
					return;
				}
				const results = ( jsonResponse.results || [] ).map(
					normalizeOpenverseResult
				);
				setData( results );
				setTotalItems( jsonResponse.result_count || 0 );
				setTotalPages( jsonResponse.page_count || 0 );
				setIsLoading( false );
			} )
			.catch( () => {
				if ( requestId !== lastRequestRef.current ) {
					return;
				}
				setData( [] );
				setTotalItems( 0 );
				setTotalPages( 0 );
				setIsLoading( false );
			} );
	}, [ search, page, perPage, isEnabled ] );

	return useMemo(
		() => ( { data, totalItems, totalPages, isLoading } ),
		[ data, totalItems, totalPages, isLoading ]
	);
}
