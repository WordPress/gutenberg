/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';

// DEFAULT_STATUSES is intentionally sorted. Items do not have spaces in between them.
// The reason for that is to match the default statuses coming from the endpoint
// (entity request and useEffect to update the view).
export const DEFAULT_STATUSES = 'draft,future,pending,private,publish'; // All statuses but 'trash'.

const DEFAULT_PAGE_BASE = {
	type: 'list',
	search: '',
	filters: [ { field: 'status', operator: 'in', value: DEFAULT_STATUSES } ],
	page: 1,
	perPage: 5,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	visibleFilters: [ 'author', 'status' ],
	// All fields are visible by default, so it's
	// better to keep track of the hidden ones.
	hiddenFields: [ 'date', 'featured-image' ],
	layout: {},
};

const DEFAULT_VIEWS = [
	{
		title: __( 'All' ),
		slug: 'all',
		view: DEFAULT_PAGE_BASE,
	},
	{
		title: __( 'Drafts' ),
		slug: 'drafts',
		view: {
			...DEFAULT_PAGE_BASE,
			filters: [ { field: 'status', operator: 'in', value: 'draft' } ],
		},
	},
	{
		title: __( 'Trash' ),
		slug: 'trash',
		icon: trash,
		view: {
			...DEFAULT_PAGE_BASE,
			filters: [ { field: 'status', operator: 'in', value: 'trash' } ],
		},
	},
];

export default DEFAULT_VIEWS;
