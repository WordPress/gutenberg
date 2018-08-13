/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import CopyContentMenuItem from './copy-content-menu-item';
import FocusMode from './focus-mode';

const withCopyMenuItem = ( menuItems ) => [
	...menuItems,
	<CopyContentMenuItem key="copy-content-menu-item" />,
];

addFilter(
	'editPost.MoreMenu.tools',
	'core/edit-post/more-menu/withCopyContentMenuItem',
	withCopyMenuItem
);

const withFocusMode = ( menuItems ) => [
	...menuItems,
	<FocusMode key="focus-mode" />,
];

addFilter(
	'editPost.MoreMenu.tools',
	'core/edit-post/more-menu/focusMode',
	withFocusMode
);
