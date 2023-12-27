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
	useSettings,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	__experimentalUseCustomUnits as useCustomUnits,
	PanelBody,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	Flex,
	FlexItem,
	RangeControl,
	__experimentalSpacer as Spacer,
	BaseControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { sprintf, __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

const RANGE_CONTROL_CUSTOM_SETTINGS = {
	px: { max: 1000, step: 1 },
	'%': { max: 100, step: 10 },
	vw: { max: 100, step: 1 },
	vh: { max: 100, step: 1 },
	em: { max: 50, step: 0.1 },
	rem: { max: 50, step: 0.1 },
	svw: { max: 100, step: 1 },
	lvw: { max: 100, step: 1 },
	dvw: { max: 100, step: 1 },
	svh: { max: 100, step: 1 },
	lvh: { max: 100, step: 1 },
	dvh: { max: 100, step: 1 },
	vi: { max: 100, step: 1 },
	svi: { max: 100, step: 1 },
	lvi: { max: 100, step: 1 },
	dvi: { max: 100, step: 1 },
	vb: { max: 100, step: 1 },
	svb: { max: 100, step: 1 },
	lvb: { max: 100, step: 1 },
	dvb: { max: 100, step: 1 },
	vmin: { max: 100, step: 1 },
	svmin: { max: 100, step: 1 },
	lvmin: { max: 100, step: 1 },
	dvmin: { max: 100, step: 1 },
	vmax: { max: 100, step: 1 },
	svmax: { max: 100, step: 1 },
	lvmax: { max: 100, step: 1 },
	dvmax: { max: 100, step: 1 },
};

function ColumnEdit( {
	attributes: { verticalAlignment, width, templateLock, allowedBlocks },
	setAttributes,
	clientId,
} ) {
	const classes = classnames( 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const [ availableUnits ] = useSettings( 'spacing.units' );
	const units = useCustomUnits( {
		availableUnits: availableUnits || [ '%', 'px', 'em', 'rem', 'vw' ],
	} );

	const customRangeValue = parseFloat( width );

	const selectedUnit =
		useMemo(
			() => parseQuantityAndUnitFromRawValue( width ),
			[ width ]
		)[ 1 ] ||
		units[ 0 ]?.value ||
		'%';

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

	const handleRangeChange = ( value ) => {
		const nextWidth = value + selectedUnit;
		setAttributes( { width: nextWidth } );
	};

	const handleUnitChange = ( newUnit ) => {
		// Attempt to smooth over differences between currentUnit and newUnit.
		// This should slightly improve the experience of switching between unit types.
		const [ currentValue, currentUnit ] =
			parseQuantityAndUnitFromRawValue( width );

		if ( [ 'em', 'rem' ].includes( newUnit ) && currentUnit === 'px' ) {
			// Convert pixel value to an approximate of the new unit, assuming a root size of 16px.
			setAttributes( {
				width: ( currentValue / 16 ).toFixed( 2 ) + newUnit,
			} );
		} else if (
			[ 'em', 'rem' ].includes( currentUnit ) &&
			newUnit === 'px'
		) {
			// Convert to pixel value assuming a root size of 16px.
			setAttributes( {
				width: Math.round( currentValue * 16 ) + newUnit,
			} );
		} else if (
			[
				'%',
				'vw',
				'svw',
				'lvw',
				'dvw',
				'vh',
				'svh',
				'lvh',
				'dvh',
				'vi',
				'svi',
				'lvi',
				'dvi',
				'vb',
				'svb',
				'lvb',
				'dvb',
				'vmin',
				'svmin',
				'lvmin',
				'dvmin',
				'vmax',
				'svmax',
				'lvmax',
				'dvmax',
			].includes( newUnit ) &&
			currentValue > 100
		) {
			// When converting to `%` or viewport-relative units, cap the new value at 100.
			setAttributes( { width: 100 + newUnit } );
		}
	};

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
				<PanelBody title={ __( 'Settings' ) }>
					<BaseControl.VisualLabel as="legend">
						{ __( 'Width' ) }
					</BaseControl.VisualLabel>
					<Flex>
						<FlexItem>
							<UnitControl
								value={ width || '' }
								onChange={ ( nextWidth ) => {
									nextWidth =
										0 > parseFloat( nextWidth )
											? '0'
											: nextWidth;
									setAttributes( { width: nextWidth } );
								} }
								units={ units }
								onUnitChange={ handleUnitChange }
								__unstableInputWidth="80px"
							/>
						</FlexItem>
						<FlexItem isBlock>
							<Spacer marginX={ 2 } marginBottom={ 0 }>
								<RangeControl
									value={ customRangeValue }
									min={ 0 }
									onChange={ handleRangeChange }
									max={
										RANGE_CONTROL_CUSTOM_SETTINGS[
											selectedUnit
										]?.max ?? 100
									}
									step={
										RANGE_CONTROL_CUSTOM_SETTINGS[
											selectedUnit
										]?.step ?? 0.1
									}
									withInputField={ false }
									__nextHasNoMarginBottom
								/>
							</Spacer>
						</FlexItem>
					</Flex>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default ColumnEdit;
