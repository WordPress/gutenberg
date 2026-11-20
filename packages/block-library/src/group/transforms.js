import {
	createBlock,
	cloneSanitizedBlock,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';
import { unlock } from '../lock-unlock';

const { isBlockAllowedInParent } = unlock( blocksPrivateApis );

function getLayout( attributes ) {
	const { layout } = attributes;
	return layout && typeof layout === 'object' && ! Array.isArray( layout )
		? layout
		: {};
}

function getColumnCount( layout ) {
	return Number.isInteger( layout.columnCount ) && layout.columnCount > 0
		? layout.columnCount
		: undefined;
}

function getMinimumColumnWidth( layout ) {
	return typeof layout.minimumColumnWidth === 'string' &&
		layout.minimumColumnWidth
		? layout.minimumColumnWidth
		: undefined;
}

const canvasTransform = {
	type: 'block',
	blocks: [ 'core/group' ],
	variationName: 'group-canvas',
	isMatch: ( attributes ) => {
		const layout = getLayout( attributes );
		return (
			!! window.__experimentalEnableGridInteractivity &&
			layout.type === 'grid' &&
			! layout.isManualPlacement
		);
	},
	transform: ( attributes, innerBlocks ) => {
		const layout = getLayout( attributes );
		const columnCount = getColumnCount( layout ) ?? 3;
		const minimumColumnWidth = getMinimumColumnWidth( layout );

		return createBlock(
			'core/group',
			{
				...attributes,
				layout: {
					type: 'grid',
					isManualPlacement: true,
					columnCount,
					rowCount: 3,
					...( minimumColumnWidth && { minimumColumnWidth } ),
				},
			},
			innerBlocks
		);
	},
};

const gridTransform = {
	type: 'block',
	blocks: [ 'core/group' ],
	variationName: 'group-grid',
	isMatch: ( attributes ) => {
		const layout = getLayout( attributes );
		return (
			!! window.__experimentalEnableGridInteractivity &&
			layout.type === 'grid' &&
			!! layout.isManualPlacement
		);
	},
	transform: ( attributes, innerBlocks ) => {
		const layout = getLayout( attributes );
		const columnCount = getColumnCount( layout );
		const minimumColumnWidth = getMinimumColumnWidth( layout );

		return createBlock(
			'core/group',
			{
				...attributes,
				layout: {
					type: 'grid',
					...( columnCount && { columnCount } ),
					...( minimumColumnWidth && { minimumColumnWidth } ),
				},
			},
			innerBlocks
		);
	},
};

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ '*' ],
			isMatch: ( {}, blocks ) =>
				blocks.every( ( { name } ) =>
					isBlockAllowedInParent( name, 'core/group' )
				),
			__experimentalConvert( blocks ) {
				const alignments = [ 'wide', 'full' ];

				// Determine the widest setting of all the blocks to be grouped
				const widestAlignment = blocks.reduce(
					( accumulator, block ) => {
						const { align } = block.attributes;
						return alignments.indexOf( align ) >
							alignments.indexOf( accumulator )
							? align
							: accumulator;
					},
					undefined
				);

				// Clone the Blocks to be Grouped
				// Failing to create new block references causes the original blocks
				// to be replaced in the switchToBlockType call thereby meaning they
				// are removed both from their original location and within the
				// new group block.
				const groupInnerBlocks = blocks.map( ( block ) =>
					cloneSanitizedBlock( block )
				);

				return createBlock(
					'core/group',
					{
						align: widestAlignment,
						layout: { type: 'constrained' },
					},
					groupInnerBlocks
				);
			},
		},
	],
	to: [ canvasTransform, gridTransform ],
};

export default transforms;
