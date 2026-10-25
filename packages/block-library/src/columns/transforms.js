import {
	cloneSanitizedBlock,
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	getBlockType,
} from '@wordpress/blocks';

const MAXIMUM_SELECTED_BLOCKS = 6;
const COLUMN_VERTICAL_ALIGNMENTS = [ 'top', 'center', 'bottom' ];
const ROW_VERTICAL_ALIGNMENTS = [ ...COLUMN_VERTICAL_ALIGNMENTS, 'stretch' ];
const FLEX_SIZE_LAYOUT_VALUES = [ 'fixed', 'fixedNoShrink' ];
const DEFAULT_COLUMN_LAYOUT = { type: 'default' };

const getObjectValue = ( value ) =>
	value && typeof value === 'object' && ! Array.isArray( value ) ? value : {};

const getGroupAttributes = ( attributes ) => {
	const groupAttributeDefinitions = getBlockType( 'core/group' )?.attributes;
	if ( ! groupAttributeDefinitions ) {
		return {};
	}
	const normalizedAttributes = getObjectValue( attributes );

	return Object.fromEntries(
		Object.entries( normalizedAttributes ).filter( ( [ name ] ) =>
			Object.hasOwn( groupAttributeDefinitions, name )
		)
	);
};

const getColumnWidth = ( width ) => {
	if ( Number.isFinite( width ) ) {
		return `${ width }%`;
	}
	if ( typeof width === 'string' && /\d/.test( width ) ) {
		return width;
	}
	return undefined;
};

const getColumnBlocksFromGrid = ( innerBlocks, columnCount ) => {
	const columnWidth = +( 100 / columnCount ).toFixed( 2 );
	const innerBlocksTemplate = Array.from(
		{ length: columnCount },
		( _, columnIndex ) => [
			'core/column',
			{ width: `${ columnWidth }%` },
			innerBlocks.filter(
				( _innerBlock, blockIndex ) =>
					blockIndex % columnCount === columnIndex
			),
		]
	);

	return createBlocksFromInnerBlocksTemplate( innerBlocksTemplate );
};

const getColumnBlocksFromRow = ( innerBlocks ) =>
	innerBlocks.map( ( innerBlock ) => {
		const style = getObjectValue( innerBlock?.attributes?.style );
		const { selfStretch, flexSize, ...remainingLayout } = getObjectValue(
			style.layout
		);
		const columnWidth = FLEX_SIZE_LAYOUT_VALUES.includes( selfStretch )
			? getColumnWidth( flexSize )
			: undefined;

		const updatedStyle = { ...style };
		if ( Object.keys( remainingLayout ).length ) {
			updatedStyle.layout = remainingLayout;
		} else {
			delete updatedStyle.layout;
		}
		const columnInnerBlock = cloneSanitizedBlock( innerBlock, {
			style: Object.keys( updatedStyle ).length
				? updatedStyle
				: undefined,
		} );

		return createBlock(
			'core/column',
			columnWidth ? { width: columnWidth } : {},
			[ columnInnerBlock ]
		);
	} );

const getGridInnerBlocks = ( innerBlocks ) =>
	innerBlocks.flatMap( ( column ) => {
		const columnInnerBlocks = column.innerBlocks || [];
		const {
			layout: layoutAttribute,
			style: styleAttribute,
			...groupAttributes
		} = getGroupAttributes( column?.attributes );
		const columnStyle = getObjectValue( styleAttribute );
		const columnLayout = getObjectValue( layoutAttribute );
		const hasGroupAttributes = Object.keys( groupAttributes ).length > 0;
		const hasColumnStyle = Object.keys( columnStyle ).length > 0;
		const hasColumnLayout = Object.keys( columnLayout ).length > 0;
		if (
			columnInnerBlocks.length > 1 ||
			hasGroupAttributes ||
			hasColumnStyle ||
			hasColumnLayout
		) {
			return [
				createBlock(
					'core/group',
					{
						...groupAttributes,
						layout: hasColumnLayout
							? columnLayout
							: DEFAULT_COLUMN_LAYOUT,
						...( hasColumnStyle && {
							style: columnStyle,
						} ),
					},
					columnInnerBlocks
				),
			];
		}
		return columnInnerBlocks;
	} );

const getRowInnerBlocks = ( innerBlocks ) => {
	const columnWidths = innerBlocks.map( ( column ) => {
		return getColumnWidth( column?.attributes?.width );
	} );
	const allColumnWidthsUnavailable = columnWidths.every(
		( columnWidth ) => ! columnWidth
	);
	const equalColumnWidth = innerBlocks.length
		? `${ +( 100 / innerBlocks.length ).toFixed( 2 ) }%`
		: undefined;

	return innerBlocks.map( ( column, index ) => {
		const columnInnerBlocks = Array.isArray( column?.innerBlocks )
			? column.innerBlocks
			: [];
		const columnWidth =
			columnWidths[ index ] ||
			( allColumnWidthsUnavailable ? equalColumnWidth : undefined );
		const childLayout = columnWidth
			? { selfStretch: 'fixed', flexSize: columnWidth }
			: { selfStretch: 'fill' };
		const {
			layout: layoutAttribute,
			style: styleAttribute,
			...groupAttributes
		} = getGroupAttributes( column?.attributes );
		const columnStyle = getObjectValue( styleAttribute );
		const columnLayout = getObjectValue( layoutAttribute );
		const hasGroupAttributes = Object.keys( groupAttributes ).length > 0;
		const hasColumnStyle = Object.keys( columnStyle ).length > 0;
		const hasColumnLayout = Object.keys( columnLayout ).length > 0;

		if (
			columnInnerBlocks.length === 1 &&
			! hasGroupAttributes &&
			! hasColumnStyle &&
			! hasColumnLayout
		) {
			const innerBlock = columnInnerBlocks[ 0 ];
			const style = getObjectValue( innerBlock.attributes?.style );
			const layout = getObjectValue( style.layout );
			const updatedLayout = { ...layout, ...childLayout };
			if ( ! columnWidth ) {
				delete updatedLayout.flexSize;
			}

			return cloneSanitizedBlock( innerBlock, {
				style: {
					...style,
					layout: updatedLayout,
				},
			} );
		}

		return createBlock(
			'core/group',
			{
				...groupAttributes,
				layout: hasColumnLayout ? columnLayout : DEFAULT_COLUMN_LAYOUT,
				style: {
					...columnStyle,
					layout: {
						...getObjectValue( columnStyle.layout ),
						...childLayout,
					},
				},
			},
			columnInnerBlocks
		);
	} );
};

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/group' ],
			priority: 1,
			transform: ( attributes, innerBlocks ) => {
				const { layout, ...rest } = attributes;
				const { columnCount } = layout;

				return createBlock(
					'core/columns',
					rest,
					getColumnBlocksFromGrid( innerBlocks, columnCount )
				);
			},
			isMatch: ( { layout } ) =>
				layout?.type === 'grid' &&
				Number.isInteger( layout?.columnCount ) &&
				layout.columnCount > 0,
		},
		{
			type: 'block',
			blocks: [ 'core/group' ],
			priority: 1,
			transform: ( attributes, innerBlocks ) => {
				const { layout, ...rest } = attributes;
				const verticalAlignment = COLUMN_VERTICAL_ALIGNMENTS.includes(
					layout?.verticalAlignment
				)
					? layout.verticalAlignment
					: undefined;

				return createBlock(
					'core/columns',
					{ ...rest, verticalAlignment },
					getColumnBlocksFromRow( innerBlocks )
				);
			},
			isMatch: ( { layout } ) =>
				layout?.type === 'flex' && layout?.orientation !== 'vertical',
		},
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ '*' ],
			__experimentalConvert: ( blocks ) => {
				const columnWidth = +( 100 / blocks.length ).toFixed( 2 );
				const innerBlocksTemplate = blocks.map(
					( { name, attributes, innerBlocks, innerContent } ) => [
						'core/column',
						{ width: `${ columnWidth }%` },
						[
							[
								name,
								{ ...attributes },
								innerBlocks,
								innerContent,
							],
						],
					]
				);
				return createBlock(
					'core/columns',
					{},
					createBlocksFromInnerBlocksTemplate( innerBlocksTemplate )
				);
			},
			isMatch: ( { length: selectedBlocksLength }, blocks ) => {
				// If a user is trying to transform a single Columns block, skip
				// the transformation. Enabling this functiontionality creates
				// nested Columns blocks resulting in an unintuitive user experience.
				// Multiple Columns blocks can still be transformed.
				if (
					blocks.length === 1 &&
					blocks[ 0 ].name === 'core/columns'
				) {
					return false;
				}

				return (
					selectedBlocksLength &&
					selectedBlocksLength <= MAXIMUM_SELECTED_BLOCKS
				);
			},
		},
		{
			type: 'block',
			blocks: [ 'core/media-text' ],
			priority: 1,
			transform: ( attributes, innerBlocks ) => {
				const {
					align,
					backgroundColor,
					textColor,
					style,
					mediaAlt: alt,
					mediaId: id,
					mediaPosition,
					mediaSizeSlug: sizeSlug,
					mediaType,
					mediaUrl: url,
					mediaWidth,
					verticalAlignment,
				} = attributes;
				let media;
				if ( mediaType === 'image' || ! mediaType ) {
					const imageAttrs = { id, alt, url, sizeSlug };
					const linkAttrs = {
						href: attributes.href,
						linkClass: attributes.linkClass,
						linkDestination: attributes.linkDestination,
						linkTarget: attributes.linkTarget,
						rel: attributes.rel,
					};
					media = [ 'core/image', { ...imageAttrs, ...linkAttrs } ];
				} else {
					media = [ 'core/video', { id, src: url } ];
				}
				const innerBlocksTemplate = [
					[ 'core/column', { width: `${ mediaWidth }%` }, [ media ] ],
					[
						'core/column',
						{ width: `${ 100 - mediaWidth }%` },
						innerBlocks,
					],
				];
				if ( mediaPosition === 'right' ) {
					innerBlocksTemplate.reverse();
				}
				return createBlock(
					'core/columns',
					{
						align,
						backgroundColor,
						textColor,
						style,
						verticalAlignment,
					},
					createBlocksFromInnerBlocksTemplate( innerBlocksTemplate )
				);
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/group' ],
			variationName: 'group-row',
			transform: ( attributes, innerBlocks ) => {
				const { verticalAlignment } = attributes;
				const rowVerticalAlignment = ROW_VERTICAL_ALIGNMENTS.includes(
					verticalAlignment
				)
					? verticalAlignment
					: 'stretch';
				return createBlock(
					'core/group',
					{
						...attributes,
						isStackedOnMobile: undefined,
						verticalAlignment: undefined,
						layout: {
							type: 'flex',
							flexWrap: 'nowrap',
							verticalAlignment: rowVerticalAlignment,
						},
					},
					getRowInnerBlocks( innerBlocks )
				);
			},
		},
		{
			type: 'block',
			blocks: [ 'core/group' ],
			variationName: 'group-grid',
			transform: ( attributes, innerBlocks ) => {
				const columnCount = innerBlocks.length;
				return createBlock(
					'core/group',
					{
						...attributes,
						isStackedOnMobile: undefined,
						verticalAlignment: undefined,
						layout: {
							type: 'grid',
							...( columnCount && { columnCount } ),
						},
					},
					getGridInnerBlocks( innerBlocks )
				);
			},
		},
	],
	ungroup: ( attributes, innerBlocks ) =>
		innerBlocks.flatMap( ( innerBlock ) => innerBlock.innerBlocks ),
};

export default transforms;
