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
	'post-excerpt',
	'post-taxonomies',
	'featured-image',
	'discussion-panel',
	'last-revision',
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
	const customItems = get( window, 'customGutenberg.panel' );
	return customItems || panelItems;
}
