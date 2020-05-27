/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import '@wordpress/notices';
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './plugins';
import './hooks';
import './store';
import Editor from './components/editor';

const fetchLinkSuggestions = ( search, { perPage = 20 } = {} ) =>
	apiFetch( {
		path: addQueryArgs( '/wp/v2/search', {
			per_page: perPage,
			search,
			type: 'post',
			subtype: 'post',
		} ),
	} ).then( ( posts ) =>
		posts.map( ( post ) => ( {
			url: post.url,
			type: post.subtype || post.type,
			id: post.id,
			title: decodeEntities( post.title ) || __( '(no title)' ),
		} ) )
	);

/**
 * Initializes the site editor screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Editor settings.
 */
export function initialize( id, settings ) {
	registerCoreBlocks();
	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks( settings );
	}
	settings.__experimentalFetchLinkSuggestions = fetchLinkSuggestions;
	render( <Editor settings={ settings } />, document.getElementById( id ) );
}

export { default as __experimentalFullscreenModeClose } from './components/header/fullscreen-mode-close';
