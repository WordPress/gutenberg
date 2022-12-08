/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as coreStore } from '@wordpress/core-data';

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
			} ) );
		},
		hasAvailableMedia: true,
	},
];

export default inserterMediaCategories;
