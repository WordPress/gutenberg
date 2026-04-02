/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { Icon, page, post } from '@wordpress/icons';
import { decodeEntities } from '@wordpress/html-entities';

const SHOWN_SUGGESTIONS = 10;

/**
 * A link completer for posts and pages.
 *
 * @type {Object}
 */
export default {
	name: 'links',
	className: 'editor-autocompleters__link',
	triggerPrefix: '[[',
	isDebounced: true,
	async options( filterValue ) {
		const options = await apiFetch( {
			path: addQueryArgs( '/wp/v2/search', {
				per_page: SHOWN_SUGGESTIONS,
				search: filterValue,
				type: 'post',
			} ),
		} );

		return options.filter( ( option ) => option.title !== '' );
	},
	getOptionKeywords( item ) {
		const expansionWords = item.title.split( /\s+/ );
		return [ ...expansionWords ];
	},
	getOptionLabel( item ) {
		return (
			<>
				<Icon icon={ item.subtype === 'page' ? page : post } />
				{ decodeEntities( item.title ) }
			</>
		);
	},
	getOptionCompletion( item ) {
		return <a href={ item.url }>{ item.title }</a>;
	},
};
