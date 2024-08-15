/**
 * WordPress dependencies
 */
import { removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './layout.js';

// This filter is removed because layout styles shouldn't be added
// until layout types are supported in the native version.
removeFilter(
	'editor.BlockListBlock',
	'core/editor/layout/with-layout-styles'
);

// This filter is removed because the layout controls shouldn't be
// enabled until layout types are supported in the native version.
removeFilter(
	'editor.BlockEdit',
	'core/editor/layout/with-inspector-controls'
);
