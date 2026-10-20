import { cog, styles, listView, page } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import type { InspectorTab } from './types';

export const TAB_SETTINGS: InspectorTab = {
	name: 'settings',
	title: __( 'Settings' ),
	value: 'settings',
	icon: cog,
};

export const TAB_STYLES: InspectorTab = {
	name: 'styles',
	title: __( 'Styles' ),
	value: 'styles',
	icon: styles,
};

export const TAB_CONTENT: InspectorTab = {
	name: 'content',
	title: __( 'Content' ),
	value: 'content',
	icon: page,
};

export const TAB_LIST_VIEW: InspectorTab = {
	name: 'list',
	title: __( 'List View' ),
	value: 'list-view',
	icon: listView,
};
