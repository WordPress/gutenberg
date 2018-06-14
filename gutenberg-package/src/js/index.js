/**
 * Internal dependencies
 */
import './wp-init.js';
import '../scss/theme.scss';
import '@wordpress/core-data';

/**
 * WordPress dependencies
 */
import * as blocks from '@wordpress/blocks';
import * as components from '@wordpress/components';
import * as coreBlocks from '@wordpress/core-blocks';
import * as data from '@wordpress/data';
import * as editor from '@wordpress/editor';
import * as editPost from '@wordpress/edit-post';
import * as plugins from '@wordpress/plugins';

export {
	blocks,
	components,
	coreBlocks,
	data,
	editor,
	editPost,
	plugins,
};
