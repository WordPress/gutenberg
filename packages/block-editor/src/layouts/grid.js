/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	justifyLeft,
	justifyCenter,
	justifyRight,
	justifyStretch,
	justifyTop,
	justifyCenterVertical,
	justifyBottom,
	justifyStretchVertical,
} from '@wordpress/icons';
import {
	BaseControl,
	Flex,
	FlexItem,
	RangeControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { appendSelectors, getBlockGapCSS } from './utils';
import { getGapCSSValue, getGapBoxControlValueFromStyle } from '../hooks/gap';
import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';
import { cleanEmptyObject, shouldSkipSerialization } from '../hooks/utils';
import { LAYOUT_DEFINITIONS } from './definitions';

const RANGE_CONTROL_MAX_VALUES = {
	px: 600,
	'%': 100,
	vw: 100,
	vh: 100,
	em: 38,
	rem: 38,
	svw: 100,
	lvw: 100,
	dvw: 100,
	svh: 100,
	lvh: 100,
	dvh: 100,
	vi: 100,
	svi: 100,
	lvi: 100,
	dvi: 100,
	vb: 100,
	svb: 100,
	lvb: 100,
	dvb: 100,
	vmin: 100,
	svmin: 100,
	lvmin: 100,
	dvmin: 100,
	vmax: 100,
	svmax: 100,
	lvmax: 100,
	dvmax: 100,
};

const units = [
	{ value: 'px', label: 'px', default: 0 },
	{ value: 'rem', label: 'rem', default: 0 },
	{ value: 'em', label: 'em', default: 0 },
];

const justifyItemsMap = {
	left: 'start',
	center: 'center',
	right: 'end',
	stretch: 'stretch',
};

const alignItemsMap = {
	top: 'start',
	center: 'center',
	bottom: 'end',
	stretch: 'stretch',
};

const defaultAlignment = 'stretch';

const gridJustificationOptions = [
	{
		value: 'left',
		icon: justifyLeft,
		label: __( 'Justify items left' ),
	},
	{
		value: 'center',
		icon: justifyCenter,
		label: __( 'Justify items center' ),
	},
	{
		value: 'right',
		icon: justifyRight,
		label: __( 'Justify items right' ),
	},
	{
		value: 'stretch',
		icon: justifyStretch,
		label: __( 'Stretch items' ),
	},
];

const gridVerticalAlignmentOptions = [
	{
		value: 'top',
		icon: justifyTop,
		label: _x( 'Align top', 'Block vertical alignment setting' ),
	},
	{
		value: 'center',
		icon: justifyCenterVertical,
		label: _x( 'Align middle', 'Block vertical alignment setting' ),
	},
	{
		value: 'bottom',
		icon: justifyBottom,
		label: _x( 'Align bottom', 'Block vertical alignment setting' ),
	},
	{
		value: 'stretch',
		icon: justifyStretchVertical,
		label: _x( 'Stretch to fill', 'Block vertical alignment setting' ),
	},
];

export default {
	name: 'grid',
	label: __( 'Grid' ),
	inspectorControls: function GridLayoutInspectorControls( {
		layout = {},
		onChange,
		layoutBlockSupport = {},
		resetLayout = {},
		clientId,
	} ) {
		const {
			allowJustification = true,
			allowVerticalAlignment = true,
			allowSizingOnChildren = false,
		} = layoutBlockSupport;

		// Always show both column and minimum width controls in Auto mode.
		// Manual mode (with isManualPlacement) is only available behind the experiment flag.
		const showColumnsControl = true;
		const showMinWidthControl =
			! layout?.isManualPlacement ||
			window.__experimentalEnableGridInteractivity;
		const defaultColumnCount = layout.isManualPlacement ? 3 : undefined;
		const hasLayoutValue = ( key, defaultValue ) =>
			( layout?.[ key ] ?? defaultValue ) !==
			( resetLayout?.[ key ] ?? defaultValue );
		const hasGridTypeValue = () =>
			hasLayoutValue( 'isManualPlacement', false );
		const hasColumnsAndRowsValue = () =>
			hasLayoutValue( 'columnCount', defaultColumnCount ) ||
			hasLayoutValue( 'rowCount' );
		const hasMinimumColumnWidthValue = () =>
			hasLayoutValue( 'minimumColumnWidth' );
		const hasJustificationValue = () =>
			hasLayoutValue( 'justifyContent', defaultAlignment );
		const hasVerticalAlignmentValue = () =>
			hasLayoutValue( 'verticalAlignment', defaultAlignment );
		const resetGridType = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					isManualPlacement: resetLayout?.isManualPlacement,
					rowCount: resetLayout?.rowCount,
					minimumColumnWidth: resetLayout?.minimumColumnWidth,
				} )
			);
		const resetColumnsAndRows = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					columnCount: resetLayout?.columnCount ?? defaultColumnCount,
					rowCount: resetLayout?.rowCount,
				} )
			);
		const resetMinimumColumnWidth = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					minimumColumnWidth: resetLayout?.minimumColumnWidth,
				} )
			);
		const resetJustification = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					justifyContent: resetLayout?.justifyContent,
				} )
			);
		const resetVerticalAlignment = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					verticalAlignment: resetLayout?.verticalAlignment,
				} )
			);

		return (
			<>
				{ window.__experimentalEnableGridInteractivity && (
					<ToolsPanelItem
						label={ __( 'Grid item position' ) }
						hasValue={ hasGridTypeValue }
						onDeselect={ resetGridType }
						isShownByDefault
						panelId={ clientId }
					>
						<GridLayoutTypeControl
							layout={ layout }
							onChange={ onChange }
						/>
					</ToolsPanelItem>
				) }
				{ showColumnsControl && (
					<ToolsPanelItem
						label={ __( 'Columns and rows' ) }
						hasValue={ hasColumnsAndRowsValue }
						onDeselect={ resetColumnsAndRows }
						isShownByDefault
						panelId={ clientId }
					>
						<GridLayoutColumnsAndRowsControl
							layout={ layout }
							onChange={ onChange }
							allowSizingOnChildren={ allowSizingOnChildren }
						/>
					</ToolsPanelItem>
				) }
				{ showMinWidthControl && (
					<ToolsPanelItem
						label={ __( 'Min. column width' ) }
						hasValue={ hasMinimumColumnWidthValue }
						onDeselect={ resetMinimumColumnWidth }
						isShownByDefault
						panelId={ clientId }
					>
						<GridLayoutMinimumWidthControl
							layout={ layout }
							onChange={ onChange }
						/>
					</ToolsPanelItem>
				) }
				{ allowJustification && (
					<ToolsPanelItem
						label={ __( 'Justification' ) }
						hasValue={ hasJustificationValue }
						onDeselect={ resetJustification }
						panelId={ clientId }
					>
						<GridLayoutJustifyItemsControl
							layout={ layout }
							onChange={ onChange }
						/>
					</ToolsPanelItem>
				) }
				{ allowVerticalAlignment && (
					<ToolsPanelItem
						label={ __( 'Alignment' ) }
						hasValue={ hasVerticalAlignmentValue }
						onDeselect={ resetVerticalAlignment }
						panelId={ clientId }
					>
						<GridLayoutVerticalAlignmentControl
							layout={ layout }
							onChange={ onChange }
						/>
					</ToolsPanelItem>
				) }
			</>
		);
	},
	toolBarControls: function GridLayoutToolbarControls() {
		return null;
	},
	getLayoutStyle: function getLayoutStyle( {
		selector,
		layout = {},
		viewportOverrides,
		style,
		blockName,
		hasBlockGapSupport,
		globalBlockGapValue,
		layoutDefinitions = LAYOUT_DEFINITIONS,
	} ) {
		const hasViewportOverrides = viewportOverrides !== undefined;
		const effectiveLayout = hasViewportOverrides
			? { ...layout, ...viewportOverrides }
			: layout;
		const hasViewportOverride = ( key ) =>
			Object.hasOwn( viewportOverrides || {}, key );
		const {
			minimumColumnWidth = null,
			columnCount = null,
			rowCount = null,
		} = effectiveLayout;
		const justifyItems = justifyItemsMap[ effectiveLayout.justifyContent ];
		const alignItems = alignItemsMap[ effectiveLayout.verticalAlignment ];

		// Check that the grid layout attributes are of the correct type, so that we don't accidentally
		// write code that stores a string attribute instead of a number.
		if ( process.env.NODE_ENV === 'development' ) {
			if (
				minimumColumnWidth &&
				typeof minimumColumnWidth !== 'string'
			) {
				throw new Error( 'minimumColumnWidth must be a string' );
			}
			if ( columnCount && typeof columnCount !== 'number' ) {
				throw new Error( 'columnCount must be a number' );
			}
			if ( rowCount && typeof rowCount !== 'number' ) {
				throw new Error( 'rowCount must be a number' );
			}
		}

		// Use the global blockGap value as fallback when available.
		// If the gap value has both top and left (separated by space), use the left value for horizontal calculations.
		let fallbackGapValue = '1.2rem';
		if ( globalBlockGapValue ) {
			const gapBox =
				getGapBoxControlValueFromStyle( globalBlockGapValue );
			fallbackGapValue =
				getSpacingPresetCssVar( gapBox?.left ) ||
				getSpacingPresetCssVar( gapBox?.top ) ||
				'1.2rem';
		}

		// If a block's block.json skips serialization for spacing or spacing.blockGap,
		// don't apply the user-defined value to the styles.
		const blockGapValue =
			style?.spacing?.blockGap &&
			! shouldSkipSerialization( blockName, 'spacing', 'blockGap' )
				? getGapCSSValue( style?.spacing?.blockGap, fallbackGapValue )
				: undefined;
		const hasBlockGapOverride =
			! hasViewportOverrides ||
			Object.hasOwn( style?.spacing || {}, 'blockGap' );

		let output = '';
		const rules = [];
		const shouldOutputGridColumns =
			! hasViewportOverrides ||
			hasViewportOverride( 'minimumColumnWidth' ) ||
			hasViewportOverride( 'columnCount' ) ||
			( hasBlockGapOverride && minimumColumnWidth && columnCount > 0 );
		const shouldOutputGridRows =
			( ! hasViewportOverrides || hasViewportOverride( 'rowCount' ) ) &&
			columnCount &&
			rowCount;
		const shouldOutputGridJustification =
			! hasViewportOverrides || hasViewportOverride( 'justifyContent' );
		const shouldOutputGridAlignment =
			! hasViewportOverrides ||
			hasViewportOverride( 'verticalAlignment' );

		if (
			shouldOutputGridColumns &&
			minimumColumnWidth &&
			columnCount > 0
		) {
			let blockGapToUse = blockGapValue || fallbackGapValue;
			// Ensure 0 values have a unit so they work in calc().
			if ( blockGapToUse === '0' || blockGapToUse === 0 ) {
				blockGapToUse = '0px';
			}
			const maxValue = `max(min( ${ minimumColumnWidth }, 100%), ( 100% - (${ blockGapToUse }*${
				columnCount - 1
			}) ) / ${ columnCount })`;
			rules.push(
				`grid-template-columns: repeat(auto-fill, minmax(${ maxValue }, 1fr))`
			);
		} else if ( shouldOutputGridColumns && columnCount ) {
			rules.push(
				`grid-template-columns: repeat(${ columnCount }, minmax(0, 1fr))`
			);
		} else if ( shouldOutputGridColumns ) {
			rules.push(
				`grid-template-columns: repeat(auto-fill, minmax(min(${
					minimumColumnWidth || '12rem'
				}, 100%), 1fr))`
			);
		}

		if ( shouldOutputGridColumns ) {
			const baseHasContainerType =
				! layout?.columnCount ||
				( layout?.columnCount && layout?.minimumColumnWidth );
			const needsContainerType = ! columnCount || minimumColumnWidth;
			if (
				needsContainerType &&
				( ! hasViewportOverrides || ! baseHasContainerType )
			) {
				rules.push( 'container-type: inline-size' );
			}
		}

		if ( shouldOutputGridRows ) {
			rules.push(
				`grid-template-rows: repeat(${ rowCount }, minmax(1rem, auto))`
			);
		}

		if ( shouldOutputGridJustification && justifyItems ) {
			rules.push( `justify-items: ${ justifyItems }` );
		}

		if ( shouldOutputGridAlignment && alignItems ) {
			rules.push( `align-items: ${ alignItems }` );
		}

		if ( rules.length ) {
			output = `${ appendSelectors( selector ) } { ${ rules.join(
				'; '
			) }; }`;
		}

		// Output blockGap styles based on rules contained in layout definitions in theme.json.
		if ( hasBlockGapSupport && hasBlockGapOverride && blockGapValue ) {
			output += getBlockGapCSS(
				selector,
				layoutDefinitions,
				'grid',
				blockGapValue
			);
		}
		return output;
	},
	getOrientation() {
		return 'horizontal';
	},
	getAlignments() {
		return [];
	},
};

function GridLayoutJustifyItemsControl( { layout, onChange } ) {
	const { justifyContent = defaultAlignment } = layout;
	const onJustificationChange = ( value ) => {
		onChange( {
			...layout,
			justifyContent: value,
		} );
	};

	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Justification' ) }
			onChange={ onJustificationChange }
			value={ justifyContent }
			className="block-editor-hooks__grid-layout-justification-controls"
		>
			{ gridJustificationOptions.map( ( { value, icon, label } ) => {
				return (
					<ToggleGroupControlOptionIcon
						key={ value }
						value={ value }
						icon={ icon }
						label={ label }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}

function GridLayoutVerticalAlignmentControl( { layout, onChange } ) {
	const { verticalAlignment = defaultAlignment } = layout;
	const onVerticalAlignmentChange = ( value ) => {
		onChange( {
			...layout,
			verticalAlignment: value,
		} );
	};

	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Alignment' ) }
			onChange={ onVerticalAlignmentChange }
			value={ verticalAlignment }
			className="block-editor-hooks__grid-layout-vertical-alignment-controls"
		>
			{ gridVerticalAlignmentOptions.map( ( { value, icon, label } ) => {
				return (
					<ToggleGroupControlOptionIcon
						key={ value }
						value={ value }
						icon={ icon }
						label={ label }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}

// Enables setting minimum width of grid items.
function GridLayoutMinimumWidthControl( { layout, onChange } ) {
	const { minimumColumnWidth, columnCount, isManualPlacement } = layout;
	const defaultValue = isManualPlacement || columnCount ? null : '12rem';
	const value = minimumColumnWidth || defaultValue;
	const [ quantity, unit = 'rem' ] =
		parseQuantityAndUnitFromRawValue( value );

	const handleSliderChange = ( next ) => {
		onChange( {
			...layout,
			minimumColumnWidth: [ next, unit ].join( '' ),
		} );
	};

	// Mostly copied from HeightControl.
	const handleUnitChange = ( newUnit ) => {
		// Attempt to smooth over differences between currentUnit and newUnit.
		// This should slightly improve the experience of switching between unit types.
		let newValue;

		if ( [ 'em', 'rem' ].includes( newUnit ) && unit === 'px' ) {
			// Convert pixel value to an approximate of the new unit, assuming a root size of 16px.
			newValue = ( quantity / 16 ).toFixed( 2 ) + newUnit;
		} else if ( [ 'em', 'rem' ].includes( unit ) && newUnit === 'px' ) {
			// Convert to pixel value assuming a root size of 16px.
			newValue = Math.round( quantity * 16 ) + newUnit;
		}

		onChange( {
			...layout,
			minimumColumnWidth: newValue,
		} );
	};

	return (
		<fieldset className="block-editor-hooks__grid-layout-minimum-width-control">
			<BaseControl.VisualLabel as="legend">
				{ __( 'Min. column width' ) }
			</BaseControl.VisualLabel>
			<Flex gap={ 4 }>
				<FlexItem isBlock>
					<UnitControl
						size="__unstable-large"
						onChange={ ( newValue ) => {
							onChange( {
								...layout,
								minimumColumnWidth:
									newValue === '' ? undefined : newValue,
							} );
						} }
						onUnitChange={ handleUnitChange }
						value={ value }
						units={ units }
						min={ 0 }
						label={ __( 'Minimum column width' ) }
						hideLabelFromVision
					/>
				</FlexItem>
				<FlexItem isBlock>
					<RangeControl
						__next40pxDefaultSize
						onChange={ handleSliderChange }
						value={ quantity || 0 }
						min={ 0 }
						max={ RANGE_CONTROL_MAX_VALUES[ unit ] || 600 }
						withInputField={ false }
						label={ __( 'Minimum column width' ) }
						hideLabelFromVision
					/>
				</FlexItem>
			</Flex>
			<p className="components-base-control__help">
				{ __(
					'Columns will wrap to fewer per row when they can no longer maintain the minimum width.'
				) }
			</p>
		</fieldset>
	);
}

// Enables setting number of grid columns
function GridLayoutColumnsAndRowsControl( {
	layout,
	onChange,
	allowSizingOnChildren,
} ) {
	// Allow unsetting the column count in Auto mode.
	const defaultColumnCount = undefined;
	const {
		columnCount = defaultColumnCount,
		rowCount,
		isManualPlacement,
	} = layout;

	return (
		<>
			<fieldset className="block-editor-hooks__grid-layout-columns-and-rows-controls">
				{ ! isManualPlacement && (
					<BaseControl.VisualLabel as="legend">
						{ __( 'Max. columns' ) }
					</BaseControl.VisualLabel>
				) }
				<Flex gap={ 4 }>
					<FlexItem isBlock>
						<NumberControl
							size="__unstable-large"
							onChange={ ( value ) => {
								// Allow unsetting the column count when in auto mode.
								const defaultNewColumnCount = isManualPlacement
									? 1
									: undefined;
								const newColumnCount =
									value === '' || value === '0'
										? defaultNewColumnCount
										: parseInt( value, 10 );
								onChange( {
									...layout,
									columnCount: newColumnCount,
								} );
							} }
							value={ columnCount }
							min={ 1 }
							label={ __( 'Columns' ) }
							hideLabelFromVision={ ! isManualPlacement }
						/>
					</FlexItem>

					<FlexItem isBlock>
						{ allowSizingOnChildren && isManualPlacement ? (
							<NumberControl
								size="__unstable-large"
								onChange={ ( value ) => {
									// Don't allow unsetting the row count.
									const newRowCount =
										value === '' || value === '0'
											? 1
											: parseInt( value, 10 );
									onChange( {
										...layout,
										rowCount: newRowCount,
									} );
								} }
								value={ rowCount }
								min={ 1 }
								label={ __( 'Rows' ) }
							/>
						) : (
							<RangeControl
								__next40pxDefaultSize
								value={ columnCount ?? 1 }
								onChange={ ( value ) =>
									onChange( {
										...layout,
										columnCount:
											value === '' || value === '0'
												? 1
												: value,
									} )
								}
								min={ 1 }
								max={ 16 }
								withInputField={ false }
								label={ __( 'Columns' ) }
								hideLabelFromVision
							/>
						) }
					</FlexItem>
				</Flex>
			</fieldset>
		</>
	);
}

// Enables switching between grid types
function GridLayoutTypeControl( { layout, onChange } ) {
	const { columnCount, rowCount, minimumColumnWidth, isManualPlacement } =
		layout;

	/**
	 * When switching, temporarily save any custom values set on the
	 * previous type so we can switch back without loss.
	 */
	const [ tempColumnCount, setTempColumnCount ] = useState(
		columnCount || 3
	);
	const [ tempRowCount, setTempRowCount ] = useState( rowCount );
	const [ tempMinimumColumnWidth, setTempMinimumColumnWidth ] = useState(
		minimumColumnWidth || '12rem'
	);

	const gridPlacement = isManualPlacement ? 'manual' : 'auto';

	const onChangeType = ( value ) => {
		if ( value === 'manual' ) {
			setTempMinimumColumnWidth( minimumColumnWidth || '12rem' );
		} else {
			setTempColumnCount( columnCount || 3 );
			setTempRowCount( rowCount );
		}
		onChange( {
			...layout,
			columnCount: value === 'manual' ? tempColumnCount : tempColumnCount,
			rowCount: value === 'manual' ? tempRowCount : undefined,
			isManualPlacement: value === 'manual' ? true : undefined,
			minimumColumnWidth:
				value === 'auto' ? tempMinimumColumnWidth : null,
		} );
	};

	const helpText =
		gridPlacement === 'manual'
			? __(
					'Grid items can be manually placed in any position on the grid.'
			  )
			: __(
					'Grid items are placed automatically depending on their order.'
			  );

	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Grid item position' ) }
			value={ gridPlacement }
			onChange={ onChangeType }
			isBlock
			help={ helpText }
		>
			<ToggleGroupControlOption
				key="auto"
				value="auto"
				label={ __( 'Auto' ) }
			/>
			<ToggleGroupControlOption
				key="manual"
				value="manual"
				label={ __( 'Manual' ) }
			/>
		</ToggleGroupControl>
	);
}
