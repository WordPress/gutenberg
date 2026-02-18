/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import {
	trash,
	pages,
	drafts,
	published,
	scheduled,
	pending,
	notAllowed,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { OPERATOR_IS_ANY } from '../../utils/constants';

export const defaultLayouts = {
	table: {},
	grid: {},
	list: {},
};

export const DEFAULT_VIEW = {
	type: 'list',
	filters: [],
	perPage: 20,
	sort: {
		field: 'title',
		direction: 'asc',
	},
	showLevels: true,
	titleField: 'title',
	mediaField: 'featured_media',
	fields: [ 'author', 'status' ],
	...defaultLayouts.list,
};

export function getDefaultViews( postType ) {
	return [
		{
			title: postType?.labels?.all_items || __( 'All items' ),
			slug: 'all',
			icon: pages,
			view: DEFAULT_VIEW,
		},
		{
			title: __( 'Published' ),
			slug: 'published',
			icon: published,
			view: {
				...DEFAULT_VIEW,
				filters: [
					{
						field: 'status',
						operator: OPERATOR_IS_ANY,
						value: 'publish',
						isLocked: true,
					},
				],
			},
		},
		{
			title: __( 'Scheduled' ),
			slug: 'future',
			icon: scheduled,
			view: {
				...DEFAULT_VIEW,
				filters: [
					{
						field: 'status',
						operator: OPERATOR_IS_ANY,
						value: 'future',
						isLocked: true,
					},
				],
			},
		},
		{
			title: __( 'Drafts' ),
			slug: 'drafts',
			icon: drafts,
			view: {
				...DEFAULT_VIEW,
				filters: [
					{
						field: 'status',
						operator: OPERATOR_IS_ANY,
						value: 'draft',
						isLocked: true,
					},
				],
			},
		},
		{
			title: __( 'Pending' ),
			slug: 'pending',
			icon: pending,
			view: {
				...DEFAULT_VIEW,
				filters: [
					{
						field: 'status',
						operator: OPERATOR_IS_ANY,
						value: 'pending',
						isLocked: true,
					},
				],
			},
		},
		{
			title: __( 'Private' ),
			slug: 'private',
			icon: notAllowed,
			view: {
				...DEFAULT_VIEW,
				filters: [
					{
						field: 'status',
						operator: OPERATOR_IS_ANY,
						value: 'private',
						isLocked: true,
					},
				],
			},
		},
		{
			title: __( 'Trash' ),
			slug: 'trash',
			icon: trash,
			view: {
				...DEFAULT_VIEW,
				type: 'table',
				layout: defaultLayouts.table.layout,
				filters: [
					{
						field: 'status',
						operator: OPERATOR_IS_ANY,
						value: 'trash',
						isLocked: true,
					},
				],
			},
		},
	];
}

const SLUG_TO_STATUS = {
	published: 'publish',
	future: 'future',
	drafts: 'draft',
	pending: 'pending',
	private: 'private',
	trash: 'trash',
};

export function getActiveViewOverridesForTab( activeView ) {
	const status = SLUG_TO_STATUS[ activeView ];
	if ( ! status ) {
		return {};
	}
	return {
		filters: [
			{
				field: 'status',
				operator: OPERATOR_IS_ANY,
				value: status,
				isLocked: true,
			},
		],
	};
}
