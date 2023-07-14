/**
 * WordPress dependencies
 */
import { cog, styles, listView } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

export const TAB_SETTINGS = {
	name: 'settings',
	title: __( 'Settings' ),
	value: 'settings',
	icon: cog,
	className: 'block-editor-block-inspector__tab-item',
};

export const TAB_STYLES = {
	name: 'styles',
	title: __( 'Styles' ),
	value: 'styles',
	icon: styles,
	className: 'block-editor-block-inspector__tab-item',
};

export const TAB_LIST_VIEW = {
	name: 'list',
	title: __( 'List View' ),
	value: 'list-view',
	icon: listView,
	className: 'block-editor-block-inspector__tab-item',
};
