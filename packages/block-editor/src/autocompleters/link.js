/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const SHOWN_SUGGESTIONS = 10;

/** @typedef {import('@wordpress/components').WPCompleter} WPCompleter */

/**
 * Creates a suggestion list for links to posts or pages.
 *
 * @return {WPCompleter} A links completer.
 */
function createLinkCompleter() {
	return {
		name: 'links',
		className: 'block-editor-autocompleters__link',
		triggerPrefix: '[[',
		options( letters ) {
			return apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					per_page: SHOWN_SUGGESTIONS,
					search: letters,
					type: 'post',
					order_by: 'menu_order',
				} ),
			} );
		},
		getOptionKeywords( item ) {
			const expansionWords = item.title.split( /\s+/ );
			return [ ...expansionWords ];
		},
		getOptionLabel( item ) {
			return item.title;
		},
		getOptionCompletion( item ) {
			return <a href={ item.url }>{ item.title }</a>;
		},
	};
}

/**
 * Creates a suggestion list for links to posts or pages..
 *
 * @return {WPCompleter} A link completer.
 */
export default createLinkCompleter();
