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

const DEFAULT_POST_BASE = {
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
			view: DEFAULT_POST_BASE,
		},
		{
			title: __( 'Published' ),
			slug: 'published',
			icon: published,
			view: {
				...DEFAULT_POST_BASE,
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
				...DEFAULT_POST_BASE,
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
				...DEFAULT_POST_BASE,
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
				...DEFAULT_POST_BASE,
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
				...DEFAULT_POST_BASE,
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
				...DEFAULT_POST_BASE,
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

export const getDefaultView = ( postType, activeView ) => {
	return getDefaultViews( postType ).find(
		( { slug } ) => slug === activeView
	)?.view;
};
