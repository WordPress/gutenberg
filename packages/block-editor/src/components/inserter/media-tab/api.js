/* eslint no-console: [ 'error', { allow: [ 'error', 'warn' ] } ] */
/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * Interface for inserter media requests.
 *
 * @typedef {Object} InserterMediaRequest
 * @property {number} per_page How many items to fetch per page.
 * @property {string} search   The search term to use for filtering the results.
 */

/**
 * Interface for inserter media responses. Any media resource should
 * map their response to this interface, in order to create the core
 * WordPress media blocks (image, video, audio).
 *
 * @typedef {Object} InserterMediaItem
 * @property {string}        title        The title of the media item.
 * @property {string}        url          The source url of the media item.
 * @property {string}        [previewUrl] The preview source url of the media item to display in the media list.
 * @property {number}        [id]         The WordPress id of the media item.
 * @property {number|string} [sourceId]   The id of the media item from external source.
 * @property {string}        [alt]        The alt text of the media item.
 * @property {string}        [caption]    The caption of the media item.
 */

/**
 * Interface for inserter media category labels.
 *
 * @typedef {Object} InserterMediaCategoryLabels
 * @property {string} name                    General name of the media category. It's used in the inserter media items list.
 * @property {string} [search_items='Search'] Label for searching items. Default is ‘Search Posts’ / ‘Search Pages’.
 */

/**
 * Interface for inserter media category.
 *
 * @typedef {Object} InserterMediaCategory
 * @property {string}                                                 name                 The name of the media category, that should be unique among all media categories.
 * @property {InserterMediaCategoryLabels}                            labels               Labels for the media category.
 * @property {('image'|'audio'|'video')}                              mediaType            The media type of the media category.
 * @property {(InserterMediaRequest) => Promise<InserterMediaItem[]>} fetch                The function to fetch media items for the category.
 * @property {(InserterMediaItem) => string}                          [getReportUrl]       If the media category supports reporting media items, this function should return
 *                                                                                         the report url for the media item. It accepts the `InserterMediaItem` as an argument.
 * @property {boolean}                                                [isExternalResource] If the media category is an external resource, this should be set to true.
 *                                                                                         This is used to avoid making a request to the external resource when the user
 *                                                                                         opens the inserter for the first time.
 */

/**
 * Registers a new inserter media category. Once registered, the media category is
 * available in the inserter's media tab.
 *
 * @param {InserterMediaCategory} category The inserter media category to register.
 *
 * @example
 * ```js
 * import { __ } from '@wordpress/i18n';
 * import { registerInserterMediaCategory } from '@wordpress/block-editor';
 *
 * registerInserterMediaCategory( {
 * 	 name: 'openverse',
 * 	 labels: {
 * 	 	name: __( 'Openverse' ),
 * 	 	search_items: __( 'Search Openverse' ),
 * 	 },
 * 	 mediaType: 'image',
 * 	 async fetch( query = {} ) {
 * 	 	const defaultArgs = {
 * 	 		mature: false,
 * 	 		excluded_source: 'flickr,inaturalist,wikimedia',
 * 	 		license: 'pdm,cc0',
 * 	 	};
 * 	 	const finalQuery = { ...query, ...defaultArgs };
 * 	 	// Sometimes you might need to map the supported request params according to `InserterMediaRequest`.
 * 	 	// interface. In this example the `search` query param is named `q`.
 * 	 	const mapFromInserterMediaRequest = {
 * 	 		per_page: 'page_size',
 * 	 		search: 'q',
 * 	 	};
 * 	 	const url = new URL( 'https://api.openverse.engineering/v1/images/' );
 * 	 	Object.entries( finalQuery ).forEach( ( [ key, value ] ) => {
 * 	 		const queryKey = mapFromInserterMediaRequest[ key ] || key;
 * 	 		url.searchParams.set( queryKey, value );
 * 	 	} );
 * 	 	const response = await window.fetch( url, {
 * 	 		headers: {
 * 	 			'User-Agent': 'WordPress/inserter-media-fetch',
 * 	 		},
 * 	 	} );
 * 	 	const jsonResponse = await response.json();
 * 	 	const results = jsonResponse.results;
 * 	 	return results.map( ( result ) => ( {
 * 	 		...result,
 * 	 		// If your response result includes an `id` prop that you want to access later, it should
 * 	 		// be mapped to `InserterMediaItem`'s `sourceId` prop. This can be useful if you provide
 * 	 		// a report URL getter.
 * 	 		// Additionally you should always clear the `id` value of your response results because
 * 	 		// it is used to identify WordPress media items.
 * 	 		sourceId: result.id,
 * 	 		id: undefined,
 * 	 		caption: result.caption,
 * 	 		previewUrl: result.thumbnail,
 * 	 	} ) );
 * 	 },
 * 	 getReportUrl: ( { sourceId } ) =>
 * 	 	`https://wordpress.org/openverse/image/${ sourceId }/report/`,
 * 	 isExternalResource: true,
 * } );
 * ```
 */
export function registerInserterMediaCategory( category ) {
	if ( ! category || typeof category !== 'object' ) {
		console.error( 'Category should be an `InserterMediaCategory` object' );
		return;
	}
	if ( ! category.name ) {
		console.error(
			'Category should have a `name` that should be unique among all media categories.'
		);
		return;
	}
	if ( ! category.labels?.name ) {
		console.error(
			'Category should have a `labels` property of `InserterMediaCategoryLabels` type.'
		);
		return;
	}
	if ( ! [ 'image', 'audio', 'video' ].includes( category.mediaType ) ) {
		console.error(
			'Category should have `mediaType` property that is one of `image|audio|video`.'
		);
		return;
	}
	if ( ! category.fetch || typeof category.fetch !== 'function' ) {
		console.error(
			'Category should have a `fetch` function defined with the following signature `(InserterMediaRequest) => Promise<InserterMediaItem[]>`.'
		);
		return;
	}
	const { inserterMediaCategories = [] } =
		select( blockEditorStore ).getSettings();
	if (
		inserterMediaCategories.some( ( { name } ) => name === category.name )
	) {
		console.error(
			`A category is already registered with the same name: "${ category.name }". `
		);
		return;
	}
	if (
		inserterMediaCategories.some(
			( { labels: { name } } ) => name === category.labels?.name
		)
	) {
		console.error(
			`A category is already registered with the same labels.name: "${ category.labels.name }". `
		);
		return;
	}
	const { __experimentalUpdateSettings } = unlock(
		dispatch( blockEditorStore )
	);
	// `inserterMediaCategories` is a private block editor setting, which means it cannot
	// be updated through the public `updateSettings` action. We preserve this setting as
	// private, so extenders can only add new inserter media categories and don't have any
	// control over the core media categories.
	__experimentalUpdateSettings( {
		inserterMediaCategories: [
			...inserterMediaCategories,
			{ ...category, isExternalResource: true },
		],
	} );
}
