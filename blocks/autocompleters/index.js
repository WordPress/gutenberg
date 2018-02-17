/**
 * External dependencies
 */
import { sortBy } from 'lodash';

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
 *
 * @returns {Promise.<Array.<CompleterOption>>} A promise that resolves to the list of completer options.
 */

/**
 * @callback FnAllowNode
 * @param {Node} textNode check if the completer can handle this text node.
 *
 * @returns {boolean} true if the completer can handle this text node.
 */

/**
 * @callback FnAllowContext
 * @param {Range} before the range before the auto complete trigger and query.
 * @param {Range} after the range after the autocomplete trigger and query.
 *
 * @returns {boolean} true if the completer can handle these ranges.
 */

/**
 * @callback FnOnSelect
 * @param {*} value the value of the completer option.
 * @param {Range} range the nodes included in the autocomplete trigger and query.
 * @param {String} query the text value of the autocomplete query.
 *
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
 * @param {Function} onReplace  Callback to replace the current block.
 *
 * @return {Completer} Completer object used by the Autocomplete component.
 */
export function blockAutocompleter( { onReplace } ) {
	// Prioritize common category in block type options
	const options = sortBy(
		getBlockTypes(),
		( { category } ) => 'common' !== category
	).map( ( blockType ) => {
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

	const allowContext = ( before, after ) => {
		return ! ( /\S/.test( before.toString() ) || /\S/.test( after.toString() ) );
	};

	const onSelect = ( blockName ) => {
		onReplace( createBlock( blockName ) );
	};

	return {
		className: 'blocks-autocompleters__block',
		triggerPrefix: '/',
		getOptions,
		allowContext,
		onSelect,
	};
}
/**
 * Returns a "completer" definition for inserting a user mention.
 * The definition can be understood by the Autocomplete component.
 *
 * @return {Completer} Completer object used by the Autocomplete component.
 */
export function userAutocompleter() {
	const getOptions = () => {
		return ( new wp.api.collections.Users() ).fetch().then( ( users ) => {
			return users.map( ( user ) => {
				return {
					value: user,
					label: [
						<img key="avatar" className="blocks-autocompleters__user-avatar" alt="" src={ user.avatar_urls[ 24 ] } />,
						<span key="name" className="blocks-autocompleters__user-name">{ user.name }</span>,
						<span key="slug" className="blocks-autocompleters__user-slug">{ user.slug }</span>,
					],
					keywords: [ user.slug, user.name ],
				};
			} );
		} );
	};

	const allowNode = () => {
		return true;
	};

	const onSelect = ( user ) => {
		return ( '@' + user.slug );
	};

	return {
		className: 'blocks-autocompleters__user',
		triggerPrefix: '@',
		getOptions,
		allowNode,
		onSelect,
	};
}
