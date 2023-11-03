/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const DEFAULT_TEMPLATE_BASE = {
	type: 'list',
	search: '',
	page: 1,
	perPage: 5,
	// All fields are visible by default, so it's
	// better to keep track of the hidden ones.
	hiddenFields: [],
	layout: {},
};

const DEFAULT_VIEWS = [
	{
		title: __( 'All' ),
		slug: 'all',
		view: { ...DEFAULT_TEMPLATE_BASE },
	},
];

export default DEFAULT_VIEWS;
