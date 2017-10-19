/**
 * External dependencies
 */
import {
	flatten,
} from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { createBlock, getBlockTypes } from '../api';
import BlockIcon from '../block-icon';

/**
 * @typedef {Object} CompleterOption
 * @property {Array.<Component>} label list of react components to render.
 * @property {Array.<String>} keywords list of key words to search.
 * @property {*} value the value that will be passed to onSelect.
 */

/**
 * @callback FnGetOptions
 * @returns {Promise.<Array.<CompleterOption>>} A promise that resolves to the list of completer options.
 */

/**
 * @callback FnAllowNode
 * @param {Node} textNode check if the completer can handle this text node.
 * @returns {boolean} true if the completer can handle this text node.
 */

/**
 * @callback FnAllowContext
 * @param {Range} before the range before the auto complete trigger and query.
 * @param {Range} range the range of the autocomplete trigger and query.
 * @param {Range} after the range after the autocomplete trigger and query.
 * @returns {boolean} true if the completer can handle these ranges.
 */

/**
 * @callback FnOnSelect
 * @param {*} value the value of the completer option.
 * @param {Range} range the nodes included in the autocomplete trigger and query.
 * @param {String} query the text value of the autocomplete query.
 * @returns {?Component} optional html to replace the range.
 */

/**
 * @typedef {Object} Completer
 * @property {?String} className A class to apply to the popup menu.
 * @property {String} triggerPrefix the prefix that will display the menu.
 * @property {FnGetOptions} getOptions get the block options in a resolved promise.
 * @property {?FnAllowNode} allowNode filter the allowed text nodes in the autocomplete.
 * @property {?FnAllowContext} allowContext filter the context under which the autocomplete activates.
 * @property {FnOnSelect} onSelect
 */

/**
 * Returns an "completer" definition for selecting from available blocks to replace the current one.
 * The definition can be understood by the Autocomplete component.
 *
 * @param  {Function} onReplace  Callback to replace the current block.
 * @returns {Completer}          Completer object used by the Autocomplete component.
 */
export function blockAutocompleter( { onReplace } ) {
	const options = getBlockTypes().map( ( blockType ) => {
		const { name, title, icon, keywords = [] } = blockType;
		return {
			value: name,
			label: [
				<BlockIcon key="icon" icon={ icon } />,
				title,
			],
			keywords: [ ...keywords, title ],
		};
	} );

	const getOptions = () => Promise.resolve( options );

	const allowContext = ( before, range, after ) => {
		return ! ( /\S/.test( before.toString() ) || /\S/.test( after.toString() ) );
	};

	const onSelect = ( blockName ) => {
		onReplace( createBlock( blockName ) );
	};

	return {
		className: 'blocks-block-autocomplete',
		triggerPrefix: '/',
		getOptions,
		allowContext,
		onSelect,
	};
}
/**
 * Returns a "completer" definition for inserting links to the posts of a user.
 * The definition can be understood by the Autocomplete component.
 *
 * @returns {Completer} Completer object used by the Autocomplete component.
 */
export function userAutocompleter() {
	const getOptions = () => {
		return ( new wp.api.collections.Users() ).fetch().then( ( users ) => {
			return users.map( ( user ) => {
				return {
					value: user,
					label: [
						<img key="avatar" alt="" src={ user.avatar_urls[ 24 ] } />,
						<span key="name" className="name">{ user.name }</span>,
						<span key="slug" className="slug">{ user.slug }</span>,
					],
					keywords: [ user.slug, user.name ],
				};
			} );
		} );
	};

	const allowNode = ( textNode ) => {
		return textNode.parentElement.closest( 'a' ) === null;
	};

	const onSelect = ( user ) => {
		return <a href={ user.link }>{ '@' + user.name }</a>;
	};

	return {
		className: 'blocks-user-autocomplete',
		triggerPrefix: '@',
		getOptions,
		allowNode,
		onSelect,
	};
}

export function hashtagAutocompleter() {
	const c = wp.api.collections;
	const getOptions = () => {
		return Promise.all( [
			( new c.Posts() ).fetch().then( function( posts ) {
				return posts.map( ( { link, title: { rendered: text }, slug } ) => ( {
					link, text, icon: 'admin-post', keywords: [ text, slug ],
				} ) );
			} ),
			( new c.Pages() ).fetch().then( function( pages ) {
				return pages.map( ( { link, title: { rendered: text }, slug } ) => ( {
					link, text, icon: 'admin-page', keywords: [ text, slug ],
				} ) );
			} ),
			( new c.Tags() ).fetch().then( function( tags ) {
				return tags.map( ( { link, name: text, slug, description } ) => ( {
					link, text, icon: 'tag', keywords: [ text, description, slug ],
				} ) );
			} ),
			( new c.Categories() ).fetch().then( function( categories ) {
				return categories.map( ( { link, name: text, slug, description } ) => ( {
					link, text, icon: 'category', keywords: [ text, description, slug ],
				} ) );
			} ),
		] ).then( function( listOfLists ) {
			return flatten( listOfLists ).map( ( { link, text, icon, keywords } ) => ( {
				value: { link, text },
				label: [
					<BlockIcon key="icon" icon={ icon } />,
					<span key="title" className="title">{ text }</span>,
				],
				keywords,
			} ) );
		} );
	};

	const allowNode = ( textNode ) => {
		return textNode.parentElement.closest( 'a' ) === null;
	};

	const onSelect = ( { link, text } ) => {
		return <a href={ link }>{ text }</a>;
	};

	return {
		className: 'blocks-hashtag-autocomplete',
		triggerPrefix: '#',
		getOptions,
		allowNode,
		onSelect,
	};
}
