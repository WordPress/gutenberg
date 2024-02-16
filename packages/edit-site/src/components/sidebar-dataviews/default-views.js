/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	LAYOUT_LIST,
	LAYOUT_TABLE,
	LAYOUT_GRID,
	OPERATOR_IN,
} from '../../utils/constants';

export const DEFAULT_CONFIG_PER_VIEW_TYPE = {
	[ LAYOUT_TABLE ]: {
		primaryField: 'title',
	},
	[ LAYOUT_GRID ]: {
		mediaField: 'featured-image',
		primaryField: 'title',
	},
	[ LAYOUT_LIST ]: {
		primaryField: 'title',
		mediaField: 'featured-image',
	},
};

const DEFAULT_PAGE_BASE = {
	type: LAYOUT_TABLE,
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	// All fields are visible by default, so it's
	// better to keep track of the hidden ones.
	hiddenFields: [ 'date', 'featured-image' ],
	layout: {
		...DEFAULT_CONFIG_PER_VIEW_TYPE[ LAYOUT_TABLE ],
	},
};

export const DEFAULT_VIEWS = {
	page: [
		{
			title: _x( 'All', 'pages' ),
			slug: 'all',
			view: DEFAULT_PAGE_BASE,
		},
		{
			title: __( 'Drafts' ),
			slug: 'drafts',
			view: {
				...DEFAULT_PAGE_BASE,
				filters: [
					{ field: 'status', operator: OPERATOR_IN, value: 'draft' },
				],
			},
		},
		{
			title: __( 'Trash' ),
			slug: 'trash',
			icon: trash,
			view: {
				...DEFAULT_PAGE_BASE,
				filters: [
					{ field: 'status', operator: OPERATOR_IN, value: 'trash' },
				],
			},
		},
	],
};
