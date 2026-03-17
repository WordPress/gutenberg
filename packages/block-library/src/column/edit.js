/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InspectorControls,
	useBlockProps,
	useSettings,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

function ColumnInspectorControls( { width, setAttributes } ) {
	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ '%', 'px', 'em', 'rem', 'vw' ],
	} );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	return (
		<ToolsPanel
			label={ __( 'Settings' ) }
			resetAll={ () => {
				setAttributes( { width: undefined } );
			} }
			dropdownMenuProps={ dropdownMenuProps }
		>
			<ToolsPanelItem
				hasValue={ () => width !== undefined }
				label={ __( 'Width' ) }
				onDeselect={ () => setAttributes( { width: undefined } ) }
				isShownByDefault
			>
				<UnitControl
					label={ __( 'Width' ) }
					__unstableInputWidth="calc(50% - 8px)"
					__next40pxDefaultSize
					value={ width || '' }
					onChange={ ( nextWidth ) => {
						nextWidth =
							0 > parseFloat( nextWidth ) ? '0' : nextWidth;
						setAttributes( { width: nextWidth } );
					} }
					units={ units }
				/>
			</ToolsPanelItem>
		</ToolsPanel>
	);
}

function ColumnEdit( {
	attributes: { verticalAlignment, width, templateLock, allowedBlocks },
	setAttributes,
	clientId,
} ) {
	const classes = clsx( 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );
	const { columnsIds, hasChildBlocks, rootClientId } = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockRootClientId } =
				select( blockEditorStore );

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
					controls={ [ 'top', 'center', 'bottom', 'stretch' ] }
				/>
			</BlockControls>
			<InspectorControls>
				<ColumnInspectorControls
					width={ width }
					setAttributes={ setAttributes }
				/>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default ColumnEdit;
