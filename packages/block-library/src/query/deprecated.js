/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	InnerBlocks,
	useInnerBlocksProps,
	useBlockProps,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

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

const migrateColors = ( attributes, innerBlocks ) => {
	// Remove color style attributes from the Query block.
	const { style, backgroundColor, gradient, textColor, ...newAttributes } =
		attributes;

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

	// Clean color values from style attribute object.
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

	// If the inner blocks are already wrapped in a single group
	// block, add the color support styles to that group block.
	if ( hasSingleInnerGroupBlock( innerBlocks ) ) {
		const groupBlock = innerBlocks[ 0 ];

		// Create new styles for the group block.
		const hasStyles =
			style?.color ||
			style?.elements?.link ||
			groupBlock.attributes.style;

		const newStyles = hasStyles
			? cleanEmptyObject( {
					...groupBlock.attributes.style,
					color: style?.color,
					elements: style?.elements?.link
						? { link: style?.elements?.link }
						: undefined,
			  } )
			: undefined;

		// Create a new Group block from the original.
		const updatedGroupBlock = createBlock(
			'core/group',
			{
				...groupBlock.attributes,
				backgroundColor,
				gradient,
				textColor,
				style: newStyles,
			},
			groupBlock.innerBlocks
		);

		return [ newAttributes, [ updatedGroupBlock ] ];
	}

	// When we don't have a single wrapping group block for the inner
	// blocks, wrap the current inner blocks in a group applying the
	// color styles to that.
	const newGroupBlock = createBlock(
		'core/group',
		{
			backgroundColor,
			gradient,
			textColor,
			style: cleanEmptyObject( {
				color: style?.color,
				elements: style?.elements?.link
					? { link: style?.elements?.link }
					: undefined,
			} ),
		},
		innerBlocks
	);

	return [ newAttributes, [ newGroupBlock ] ];
};

const hasSingleInnerGroupBlock = ( innerBlocks = [] ) =>
	innerBlocks.length === 1 && innerBlocks[ 0 ].name === 'core/group';

const migrateToConstrainedLayout = ( attributes ) => {
	const { layout = null } = attributes;
	if ( ! layout ) {
		return attributes;
	}
	const { inherit = null, contentSize = null, ...newLayout } = layout;

	if ( inherit || contentSize ) {
		return {
			...attributes,
			layout: {
				...newLayout,
				contentSize,
				type: 'constrained',
			},
		};
	}

	return attributes;
};

const findPostTemplateBlock = ( innerBlocks = [] ) => {
	let foundBlock = null;
	for ( const block of innerBlocks ) {
		if ( block.name === 'core/post-template' ) {
			foundBlock = block;
			break;
		} else if ( block.innerBlocks.length ) {
			foundBlock = findPostTemplateBlock( block.innerBlocks );
		}
	}
	return foundBlock;
};

const replacePostTemplateBlock = ( innerBlocks = [], replacementBlock ) => {
	innerBlocks.forEach( ( block, index ) => {
		if ( block.name === 'core/post-template' ) {
			innerBlocks.splice( index, 1, replacementBlock );
		} else if ( block.innerBlocks.length ) {
			block.innerBlocks = replacePostTemplateBlock(
				block.innerBlocks,
				replacementBlock
			);
		}
	} );
	return innerBlocks;
};

const migrateDisplayLayout = ( attributes, innerBlocks ) => {
	const { displayLayout = null, ...newAttributes } = attributes;
	if ( ! displayLayout ) {
		return [ attributes, innerBlocks ];
	}
	const postTemplateBlock = findPostTemplateBlock( innerBlocks );
	if ( ! postTemplateBlock ) {
		return [ attributes, innerBlocks ];
	}

	const { type, columns } = displayLayout;

	// Convert custom displayLayout values to canonical layout types.
	const updatedLayoutType = type === 'flex' ? 'grid' : 'default';

	const newPostTemplateBlock = createBlock(
		'core/post-template',
		{
			...postTemplateBlock.attributes,
			layout: {
				type: updatedLayoutType,
				...( columns && { columnCount: columns } ),
			},
		},
		postTemplateBlock.innerBlocks
	);
	return [
		newAttributes,
		replacePostTemplateBlock( innerBlocks, newPostTemplateBlock ),
	];
};

// Version with NO wrapper `div` element.
const v1 = {
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
	migrate( attributes, innerBlocks ) {
		const withTaxQuery = migrateToTaxQuery( attributes );
		const { layout, ...restWithTaxQuery } = withTaxQuery;
		const newAttributes = {
			...restWithTaxQuery,
			displayLayout: withTaxQuery.layout,
		};
		return migrateDisplayLayout( newAttributes, innerBlocks );
	},
	save() {
		return <InnerBlocks.Content />;
	},
};

// Version with `categoryIds and tagIds`.
const v2 = {
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
		layout: true,
	},
	isEligible: ( { query: { categoryIds, tagIds } = {} } ) =>
		categoryIds || tagIds,
	migrate( attributes, innerBlocks ) {
		const withTaxQuery = migrateToTaxQuery( attributes );
		const [ withColorAttributes, withColorInnerBlocks ] = migrateColors(
			withTaxQuery,
			innerBlocks
		);
		const withConstrainedLayoutAttributes =
			migrateToConstrainedLayout( withColorAttributes );
		return migrateDisplayLayout(
			withConstrainedLayoutAttributes,
			withColorInnerBlocks
		);
	},
	save( { attributes: { tagName: Tag = 'div' } } ) {
		const blockProps = useBlockProps.save();
		const innerBlocksProps = useInnerBlocksProps.save( blockProps );
		return <Tag { ...innerBlocksProps } />;
	},
};

// Version with color support prior to moving it to the PostTemplate block.
const v3 = {
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
		layout: true,
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
	migrate( attributes, innerBlocks ) {
		const [ withColorAttributes, withColorInnerBlocks ] = migrateColors(
			attributes,
			innerBlocks
		);
		const withConstrainedLayoutAttributes =
			migrateToConstrainedLayout( withColorAttributes );
		return migrateDisplayLayout(
			withConstrainedLayoutAttributes,
			withColorInnerBlocks
		);
	},
	save( { attributes: { tagName: Tag = 'div' } } ) {
		const blockProps = useBlockProps.save();
		const innerBlocksProps = useInnerBlocksProps.save( blockProps );
		return <Tag { ...innerBlocksProps } />;
	},
};

const v4 = {
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
		layout: true,
	},
	save( { attributes: { tagName: Tag = 'div' } } ) {
		const blockProps = useBlockProps.save();
		const innerBlocksProps = useInnerBlocksProps.save( blockProps );
		return <Tag { ...innerBlocksProps } />;
	},
	isEligible: ( { layout } ) =>
		layout?.inherit ||
		( layout?.contentSize && layout?.type !== 'constrained' ),
	migrate( attributes, innerBlocks ) {
		const withConstrainedLayoutAttributes =
			migrateToConstrainedLayout( attributes );
		return migrateDisplayLayout(
			withConstrainedLayoutAttributes,
			innerBlocks
		);
	},
};

const v5 = {
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
		anchor: true,
		html: false,
		layout: true,
	},
	save( { attributes: { tagName: Tag = 'div' } } ) {
		const blockProps = useBlockProps.save();
		const innerBlocksProps = useInnerBlocksProps.save( blockProps );
		return <Tag { ...innerBlocksProps } />;
	},
	isEligible: ( { displayLayout } ) => {
		return !! displayLayout;
	},
	migrate: migrateDisplayLayout,
};

const deprecated = [ v5, v4, v3, v2, v1 ];

export default deprecated;
