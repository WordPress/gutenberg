/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
/**
 * External dependencies
 */
import { set } from 'lodash';

function disableInsertingNonNavigationBlocks( settings, name ) {
	if (
		! [ 'edit-navigation/menu', 'edit-navigation/menu-item' ].includes(
			name
		)
	) {
		set( settings, [ 'supports', 'inserter' ], false );
	}
	return settings;
}

export default () =>
	addFilter(
		'blocks.registerBlockType',
		'core/edit-navigation/disable-inserting-non-navigation-blocks',
		disableInsertingNonNavigationBlocks
	);
