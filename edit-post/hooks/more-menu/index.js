/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import CopyContentMenuItem from '../../components/header/copy-content-menu-item';

const withCopyContentMenuItem = ( menuItems ) => [
	...menuItems,
	<CopyContentMenuItem key="copy-content-menu-item" />,
];

addFilter(
	'editPost.MoreMenu.tools',
	'core/edit-post/more-menu/withCopyContentButton',
	withCopyContentMenuItem
);
