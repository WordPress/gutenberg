/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { View } from '@wordpress/dataviews';

const LAYOUT_GRID = 'grid';
const LAYOUT_TABLE = 'table';

export const DEFAULT_VIEW: View = {
	type: LAYOUT_GRID,
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc',
	},
	filters: [],
	fields: [ 'sync-status' ],
	layout: {
		badgeFields: [ 'sync-status' ],
	},
	titleField: 'title',
	mediaField: 'preview',
};

export const DEFAULT_VIEWS: {
	slug: string;
	label: string;
}[] = [
	{
		slug: 'all',
		label: __( 'All patterns' ),
	},
	{
		slug: 'my-patterns',
		label: __( 'My patterns' ),
	},
	{
		slug: 'registered',
		label: __( 'Registered' ),
	},
];

export const DEFAULT_LAYOUTS = {
	[ LAYOUT_TABLE ]: {},
	[ LAYOUT_GRID ]: {
		layout: {
			badgeFields: [ 'sync-status' ],
		},
	},
};
