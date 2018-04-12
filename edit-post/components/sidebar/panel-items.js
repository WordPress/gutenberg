/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Panel (sidebar) items.
 *
 * @var {Array} items
 */
const panelItems = [
	'post-status',
	'last-revision',
	'post-taxonomies',
	'featured-image',
	'post-excerpt',
	'discussion-panel',
	'page-attributes',
	'document-outline-panel',
	'meta-boxes',
];

/**
 * Returns all panel items.
 *
 * @return {Array} Panel items.
 */
export function getPanelItems() {
	const customItems = get( window, 'customGutenberg.panels' );
	return customItems || panelItems;
}
