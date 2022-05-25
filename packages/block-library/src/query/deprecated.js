/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	useInnerBlocksProps,
	useBlockProps,
} from '@wordpress/block-editor';

const migrateToTaxQuery = ( attributes ) => {
	const { query } = attributes;
	const newQuery = {
		...omit( query, [ 'categoryIds', 'tagIds' ] ),
	};
	if ( query.categoryIds?.length || query.tagIds?.length ) {
		newQuery.taxQuery = {
			category: !! query.categoryIds?.length
				? query.categoryIds
				: undefined,
			post_tag: !! query.tagIds?.length ? query.tagIds : undefined,
		};
	}
	return {
		...attributes,
		query: newQuery,
	};
};

const deprecated = [
	// Version with `categoryIds and tagIds`.
	{
		attributes: {
			queryId: {
				type: 'number',
			},
			query: {
				type: 'object',
				default: {
					perPage: null,
					pages: 0,
					offset: 0,
					postType: 'post',
					categoryIds: [],
					tagIds: [],
					order: 'desc',
					orderBy: 'date',
					author: '',
					search: '',
					exclude: [],
					sticky: '',
					inherit: true,
				},
			},
			tagName: {
				type: 'string',
				default: 'div',
			},
			displayLayout: {
				type: 'object',
				default: {
					type: 'list',
				},
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			html: false,
			color: {
				gradients: true,
				link: true,
			},
			__experimentalLayout: true,
		},
		isEligible: ( { query: { categoryIds, tagIds } = {} } ) =>
			categoryIds || tagIds,
		migrate: migrateToTaxQuery,
		save( { attributes: { tagName: Tag = 'div' } } ) {
			const blockProps = useBlockProps.save();
			const innerBlocksProps = useInnerBlocksProps.save( blockProps );
			return <Tag { ...innerBlocksProps } />;
		},
	},
	// Version with NO wrapper `div` element.
	{
		attributes: {
			queryId: {
				type: 'number',
			},
			query: {
				type: 'object',
				default: {
					perPage: null,
					pages: 0,
					offset: 0,
					postType: 'post',
					categoryIds: [],
					tagIds: [],
					order: 'desc',
					orderBy: 'date',
					author: '',
					search: '',
					exclude: [],
					sticky: '',
					inherit: true,
				},
			},
			layout: {
				type: 'object',
				default: {
					type: 'list',
				},
			},
		},
		supports: {
			html: false,
		},
		migrate( attributes ) {
			const withTaxQuery = migrateToTaxQuery( attributes );
			return {
				...omit( withTaxQuery, [ 'layout' ] ),
				displayLayout: withTaxQuery.layout,
			};
		},
		save() {
			return <InnerBlocks.Content />;
		},
	},
];

export default deprecated;
