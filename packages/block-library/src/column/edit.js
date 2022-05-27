/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InspectorControls,
	useBlockProps,
	useSetting,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	__experimentalUseCustomUnits as useCustomUnits,
	PanelBody,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';

function ColumnEdit( {
	attributes: {
		verticalAlignment,
		width,
		templateLock = false,
		allowedBlocks,
	},
	setAttributes,
	clientId,
} ) {
	const classes = classnames( 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [
			'%',
			'px',
			'em',
			'rem',
			'vw',
		],
	} );

	const { columnsIds, hasChildBlocks, rootClientId } = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockRootClientId } = select(
				blockEditorStore
			);

			const rootId = getBlockRootClientId( clientId );

			return {
				hasChildBlocks: getBlockOrder( clientId ).length > 0,
				rootClientId: rootId,
				columnsIds: getBlockOrder( rootId ),
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const updateAlignment = ( value ) => {
		// Update own alignment.
		setAttributes( { verticalAlignment: value } );
		// Reset parent Columns block.
		updateBlockAttributes( rootClientId, {
			verticalAlignment: null,
		} );
	};

	const widthWithUnit = Number.isFinite( width ) ? width + '%' : width;
	const blockProps = useBlockProps( {
		className: classes,
		style: widthWithUnit ? { flexBasis: widthWithUnit } : undefined,
	} );

	const columnsCount = columnsIds.length;
	const currentColumnPosition = columnsIds.indexOf( clientId ) + 1;

	const label = sprintf(
		/* translators: 1: Block label (i.e. "Block: Column"), 2: Position of the selected block, 3: Total number of sibling blocks of the same type */
		__( '%1$s (%2$d of %3$d)' ),
		blockProps[ 'aria-label' ],
		currentColumnPosition,
		columnsCount
	);

	const innerBlocksProps = useInnerBlocksProps(
		{ ...blockProps, 'aria-label': label },
		{
			templateLock,
			allowedBlocks,
			renderAppender: hasChildBlocks
				? undefined
				: InnerBlocks.ButtonBlockAppender,
		}
	);

	return (
		<>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Column settings' ) }>
					<UnitControl
						label={ __( 'Width' ) }
						labelPosition="edge"
						__unstableInputWidth="80px"
						value={ width || '' }
						onChange={ ( nextWidth ) => {
							nextWidth =
								0 > parseFloat( nextWidth ) ? '0' : nextWidth;
							setAttributes( { width: nextWidth } );
						} }
						units={ units }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default ColumnEdit;
