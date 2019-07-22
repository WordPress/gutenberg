/**
 * Internal dependencies
 */
import { getElementSelectorList } from './get-element-list';

/**
 * Returns a list of a block's contenteditable elements.
 *
 * @param {boolean} empty When true, restricts the list to contenteditable elements with no value
 */

export async function textContentAreas( { empty = false } ) {
	const selectors = [
		'.wp-block.is-selected [contenteditable]',
		'.wp-block.is-typing [contenteditable]',
	].map( ( selector ) => {
		return empty ? selector + '[data-is-placeholder-visible="true"]' : selector;
	}, empty ).join( ',' );

	return await getElementSelectorList( selectors );
}
