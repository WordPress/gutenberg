/**
 * External dependencies
 */
import useSWR from 'use-swr';
import { map  } from 'lodash';


/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { decodeEntities } from '@wordpress/html-entities';
import { addQueryArgs } from '@wordpress/url';

/**
 * ASync/Await fetch handler.
 *
 * @param {string} path fetching path.
 * @return {Promise<*>}
 */
const doFetchPages = async function( path ) {
	const pages = await apiFetch( { path } );

	return await map( pages, ( { id, link: url, title, type, subtype } ) => ( {
		id,
		url,
		title: decodeEntities( title.rendered ) || __( '(no title)' ),
		type: subtype || type,
	} ) );
};

/**
 * Query Pgaes hook.
 * @param {object} query Query pages parameters.
 * @return {{error: any; data: any; revalidate: () => Promise<boolean>; isValidating: boolean}}
 */
const useQueryPages = ( query = {} ) => {
	return useSWR( addQueryArgs( '/wp/v2/pages', query ), doFetchPages );
};

export { useQueryPages };
