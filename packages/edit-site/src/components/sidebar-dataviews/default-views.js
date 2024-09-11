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
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	LAYOUT_LIST,
	LAYOUT_TABLE,
	LAYOUT_GRID,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
} from '../../utils/constants';

export const defaultLayouts = {
	[ LAYOUT_TABLE ]: {
		layout: {
			primaryField: 'title',
			styles: {
				'featured-image': {
					width: '1%',
				},
				title: {
					maxWidth: 300,
				},
			},
		},
	},
	[ LAYOUT_GRID ]: {
		layout: {
			mediaField: 'featured-image',
			primaryField: 'title',
		},
	},
	[ LAYOUT_LIST ]: {
		layout: {
			primaryField: 'title',
			mediaField: 'featured-image',
		},
	},
};

const DEFAULT_POST_BASE = {
	type: LAYOUT_LIST,
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	fields: [ 'title', 'author', 'status' ],
	layout: defaultLayouts[ LAYOUT_LIST ].layout,
};

function useDataViewItemCounts( { postType } ) {
	const { records, totalItems } = useEntityRecords( 'postType', postType, {
		per_page: -1,
		status: [ 'any', 'trash' ],
	} );
	return useMemo( () => {
		if ( ! records ) {
			return {};
		}
		const counts = {
			all: totalItems,
			drafts: records.filter( ( record ) => record.status === 'draft' )
				.length,
			future: records.filter( ( record ) => record.status === 'future' )
				.length,
			pending: records.filter( ( record ) => record.status === 'pending' )
				.length,
			private: records.filter( ( record ) => record.status === 'private' )
				.length,
			published: records.filter(
				( record ) => record.status === 'publish'
			).length,
			trash: records.filter( ( record ) => record.status === 'trash' )
				.length,
		};
		return counts;
	}, [ records, totalItems ] );
}

export function useDefaultViews( { postType } ) {
	const labels = useSelect(
		( select ) => select( coreStore ).getPostType( postType )?.labels,
		[ postType ]
	);
	const counts = useDataViewItemCounts( { postType } );

	return useMemo( () => {
		return [
			{
				title: labels?.all_items || __( 'All items' ),
				slug: 'all',
				icon: pages,
				view: {
					...DEFAULT_POST_BASE,
					filters: [
						{
							field: 'status',
							operator: OPERATOR_IS_NONE,
							value: 'trash',
						},
					],
				},
				count: counts?.all,
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
						},
					],
				},
				count: counts?.published,
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
						},
					],
				},
				count: counts?.future,
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
						},
					],
				},
				count: counts?.drafts,
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
						},
					],
				},
				count: counts?.pending,
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
						},
					],
				},
				count: counts?.private,
			},
			{
				title: __( 'Trash' ),
				slug: 'trash',
				icon: trash,
				view: {
					...DEFAULT_POST_BASE,
					type: LAYOUT_TABLE,
					layout: defaultLayouts[ LAYOUT_TABLE ].layout,
					filters: [
						{
							field: 'status',
							operator: OPERATOR_IS_ANY,
							value: 'trash',
						},
					],
				},
				count: counts?.trash,
			},
		];
	}, [ labels, counts ] );
}
