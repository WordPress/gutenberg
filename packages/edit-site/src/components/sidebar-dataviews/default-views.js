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
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	LAYOUT_LIST,
	LAYOUT_TABLE,
	LAYOUT_GRID,
	OPERATOR_IS_ANY,
} from '../../utils/constants';

export const defaultLayouts = {
	[ LAYOUT_TABLE ]: {
		layout: {
			primaryField: 'title',
			combinedFields: [
				{
					id: 'post',
					header: __( 'Title' ),
					children: [ 'featured-image', 'title' ],
					direction: 'horizontal',
				},
			],
			styles: {
				'featured-image': {
					width: '1%',
				},
				post: {
					maxWidth: 300,
				},
			},
		},
		fields: [ 'post', 'author', 'status' ],
	},
	[ LAYOUT_GRID ]: {
		layout: {
			mediaField: 'featured-image',
			primaryField: 'title',
		},
		fields: [ 'title', 'author', 'status' ],
	},
	[ LAYOUT_LIST ]: {
		layout: {
			primaryField: 'title',
			mediaField: 'featured-image',
		},
		fields: [ 'title', 'author', 'status' ],
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
	layout: defaultLayouts[ LAYOUT_LIST ].layout,
	fields: defaultLayouts[ LAYOUT_LIST ].fields,
};

export function useDefaultViews( { postType } ) {
	const labels = useSelect(
		( select ) => {
			const { getPostType } = select( coreStore );
			return getPostType( postType )?.labels;
		},
		[ postType ]
	);
	return useMemo( () => {
		return {
			[ postType ]: [
				{
					title: labels?.all_items || __( 'All items' ),
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
						filters: [
							{
								field: 'status',
								operator: OPERATOR_IS_ANY,
								value: 'trash',
							},
						],
					},
				},
			],
		};
	}, [ labels, postType ] );
}
