/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	InnerBlocks,
	useInnerBlocksProps,
	useBlockProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import cleanEmptyObject from '../utils/clean-empty-object';

const migrateToTaxQuery = ( attributes ) => {
	const { query } = attributes;
	const { categoryIds, tagIds, ...newQuery } = query;

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

const colorSupportedInnerBlocks = [
	'core/post-template',
	'core/query-pagination',
	'core/query-no-results',
];

const deprecated = [
	// Version with color support prior to moving it to the PostTemplate block.
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
					order: 'desc',
					orderBy: 'date',
					author: '',
					search: '',
					exclude: [],
					sticky: '',
					inherit: true,
					taxQuery: null,
					parents: [],
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
			namespace: {
				type: 'string',
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			html: false,
			color: {
				gradients: true,
				link: true,
				__experimentalDefaultControls: {
					background: true,
					text: true,
				},
			},
			__experimentalLayout: true,
		},
		isEligible( attributes ) {
			const { style, backgroundColor, gradient, textColor } = attributes;
			return (
				backgroundColor ||
				gradient ||
				textColor ||
				style?.color ||
				style?.elements?.link
			);
		},
		migrate: ( attributes, innerBlocks ) => {
			// Remove color style attributes from the Query block.
			const {
				style,
				backgroundColor,
				gradient,
				textColor,
				...newAttributes
			} = attributes;

			const hasColorStyles =
				backgroundColor ||
				gradient ||
				textColor ||
				style?.color ||
				style?.elements?.link;

			// If the query block doesn't currently have any color styles,
			// nothing needs migrating.
			if ( ! hasColorStyles ) {
				return [ attributes, innerBlocks ];
			}

			if ( style ) {
				newAttributes.style = cleanEmptyObject( {
					...style,
					color: undefined,
					elements: {
						...style.elements,
						link: undefined,
					},
				} );
			}

			// Apply the color styles and attributes to the inner PostTemplate,
			// Query Pagination, and Query No Results blocks.
			const updatedInnerBlocks = innerBlocks.map( ( innerBlock ) => {
				if ( ! colorSupportedInnerBlocks.includes( innerBlock.name ) ) {
					return innerBlock;
				}

				const hasStyles =
					style?.color ||
					style?.elements?.link ||
					innerBlock.attributes.style;

				const newStyles = hasStyles
					? cleanEmptyObject( {
							...innerBlock.attributes.style,
							color: style?.color,
							elements: style?.elements?.link
								? { link: style?.elements?.link }
								: undefined,
					  } )
					: undefined;

				return createBlock(
					innerBlock.name,
					{
						...innerBlock.attributes,
						backgroundColor,
						gradient,
						textColor,
						style: newStyles,
					},
					innerBlock.innerBlocks
				);
			} );

			return [ newAttributes, updatedInnerBlocks ];
		},
		save( { attributes: { tagName: Tag = 'div' } } ) {
			const blockProps = useBlockProps.save();
			const innerBlocksProps = useInnerBlocksProps.save( blockProps );
			return <Tag { ...innerBlocksProps } />;
		},
	},
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
			const { layout, ...restWithTaxQuery } = withTaxQuery;
			return {
				...restWithTaxQuery,
				displayLayout: withTaxQuery.layout,
			};
		},
		save() {
			return <InnerBlocks.Content />;
		},
	},
];

export default deprecated;
