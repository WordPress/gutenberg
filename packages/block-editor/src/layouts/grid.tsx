import { __ } from '@wordpress/i18n';
import {
	BaseControl,
	Flex,
	FlexItem,
	RangeControl,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { appendSelectors, getBlockGapCSS } from './utils';
import { getGapCSSValue, getGapBoxControlValueFromStyle } from '../hooks/gap';
import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';
import { cleanEmptyObject, shouldSkipSerialization } from '../hooks/utils';
import { LAYOUT_DEFINITIONS } from './definitions';
import type {
	LayoutAlignment,
	LayoutControlProps,
	LayoutInspectorControlsProps,
	LayoutStyleArgs,
} from './types';

const RANGE_CONTROL_MAX_VALUES: Record< string, number > = {
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

export default {
	name: 'grid',
	label: __( 'Grid' ),
	hasInspectorControls() {
		return true;
	},
	inspectorControls: function GridLayoutInspectorControls( {
		layout = {},
		onChange,
		layoutBlockSupport = {},
		resetLayout = {},
		clientId,
	}: LayoutInspectorControlsProps ) {
		const { allowSizingOnChildren = false } = layoutBlockSupport;

		// Always show both column and minimum width controls in Auto mode.
		// Manual mode (with isManualPlacement) is only available behind the experiment flag.
		const showColumnsControl = true;
		const showMinWidthControl =
			! layout?.isManualPlacement ||
			window.__experimentalEnableGridInteractivity;
		// Auto-fit/auto-fill only applies when grid items are placed
		// automatically, so the control is irrelevant in manual placement mode.
		const showFillControl = ! layout?.isManualPlacement;
		const defaultColumnCount = layout.isManualPlacement ? 3 : undefined;
		const hasLayoutValue = ( key: string, defaultValue?: unknown ) =>
			( layout?.[ key ] ?? defaultValue ) !==
			( resetLayout?.[ key ] ?? defaultValue );
		const hasColumnsAndRowsValue = () =>
			hasLayoutValue( 'columnCount', defaultColumnCount ) ||
			hasLayoutValue( 'rowCount' );
		const hasMinimumColumnWidthValue = () =>
			hasLayoutValue( 'minimumColumnWidth' );
		const hasFillValue = () => hasLayoutValue( 'autoFit', false );
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
		const resetFill = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					autoFit: resetLayout?.autoFit,
				} )
			);

		return (
			<>
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
				{ showFillControl && (
					<ToolsPanelItem
						label={ __( 'Fill available space' ) }
						hasValue={ hasFillValue }
						onDeselect={ resetFill }
						panelId={ clientId }
					>
						<GridLayoutFillControl
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
	}: LayoutStyleArgs ): string {
		const hasViewportOverrides = viewportOverrides !== undefined;
		const effectiveLayout = hasViewportOverrides
			? { ...layout, ...viewportOverrides }
			: layout;
		const hasViewportOverride = ( key: string ) =>
			Object.hasOwn( viewportOverrides || {}, key );
		const {
			minimumColumnWidth = null,
			columnCount = null,
			rowCount = null,
			autoFit = false,
		} = effectiveLayout;

		// When enabled, columns stretch to fill the available space using
		// `auto-fit`; otherwise empty tracks are preserved with `auto-fill`.
		const autoPlacement = autoFit ? 'auto-fit' : 'auto-fill';

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
			if ( autoFit && typeof autoFit !== 'boolean' ) {
				throw new Error( 'autoFit must be a boolean' );
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
		const rules: string[] = [];
		const shouldOutputGridColumns =
			! hasViewportOverrides ||
			hasViewportOverride( 'minimumColumnWidth' ) ||
			hasViewportOverride( 'columnCount' ) ||
			hasViewportOverride( 'autoFit' ) ||
			( hasBlockGapOverride &&
				minimumColumnWidth &&
				// A `null` count compares as `false`.
				( columnCount as number ) > 0 );
		const shouldOutputGridRows =
			( ! hasViewportOverrides || hasViewportOverride( 'rowCount' ) ) &&
			columnCount &&
			rowCount;

		if (
			shouldOutputGridColumns &&
			minimumColumnWidth &&
			( columnCount as number ) > 0
		) {
			const blockGapBoxControlValue = blockGapValue
				? // A block gap value comes from the style's block gap.
					getGapBoxControlValueFromStyle( style!.spacing!.blockGap )
				: undefined;
			let blockGapToUse =
				getSpacingPresetCssVar( blockGapBoxControlValue?.left ) ||
				fallbackGapValue;
			// Ensure 0 values have a unit so they work in calc().
			// The gap is a string; the number check is kept from before.
			if (
				blockGapToUse === '0' ||
				( blockGapToUse as string | number ) === 0
			) {
				blockGapToUse = '0px';
			}
			const maxValue = `max(min( ${ minimumColumnWidth }, 100%), ( 100% - (${ blockGapToUse }*${
				// Checked to be above zero just above.
				columnCount! - 1
			}) ) / ${ columnCount })`;
			rules.push(
				`grid-template-columns: repeat(${ autoPlacement }, minmax(${ maxValue }, 1fr))`
			);
		} else if ( shouldOutputGridColumns && columnCount ) {
			rules.push(
				`grid-template-columns: repeat(${ columnCount }, minmax(0, 1fr))`
			);
		} else if ( shouldOutputGridColumns ) {
			rules.push(
				`grid-template-columns: repeat(${ autoPlacement }, minmax(min(${
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
	getOrientation(): string {
		return 'horizontal';
	},
	getAlignments(): LayoutAlignment[] {
		return [];
	},
};

// Enables setting minimum width of grid items.
function GridLayoutMinimumWidthControl( {
	layout,
	onChange,
}: LayoutControlProps ) {
	const { minimumColumnWidth, columnCount, isManualPlacement } = layout;
	const defaultValue = isManualPlacement || columnCount ? null : '12rem';
	const value = minimumColumnWidth || defaultValue;
	const [ quantity, unit = 'rem' ] =
		// A `null` value parses as no quantity.
		parseQuantityAndUnitFromRawValue( value as string | undefined );

	const handleSliderChange = ( next?: number ) => {
		onChange( {
			...layout,
			minimumColumnWidth: [ next, unit ].join( '' ),
		} );
	};

	// Mostly copied from HeightControl.
	const handleUnitChange = ( newUnit?: string ) => {
		// Attempt to smooth over differences between currentUnit and newUnit.
		// This should slightly improve the experience of switching between unit types.
		let newValue;

		// The unit control always passes a unit.
		if ( [ 'em', 'rem' ].includes( newUnit as string ) && unit === 'px' ) {
			// Convert pixel value to an approximate of the new unit, assuming a root size of 16px.
			// An absent quantity converts to `NaN`, as before.
			newValue = ( ( quantity as number ) / 16 ).toFixed( 2 ) + newUnit;
		} else if ( [ 'em', 'rem' ].includes( unit ) && newUnit === 'px' ) {
			// Convert to pixel value assuming a root size of 16px.
			newValue = Math.round( ( quantity as number ) * 16 ) + newUnit;
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
						onChange={ ( newValue ) => {
							onChange( {
								...layout,
								minimumColumnWidth:
									newValue === '' ? undefined : newValue,
							} );
						} }
						onUnitChange={ handleUnitChange }
						// A `null` value shows an empty field.
						value={ value as string | undefined }
						units={ units }
						min={ 0 }
						label={ __( 'Minimum column width' ) }
						hideLabelFromVision
					/>
				</FlexItem>
				<FlexItem isBlock>
					<RangeControl
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
}: LayoutControlProps & { allowSizingOnChildren?: boolean } ) {
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
							onChange={ ( value ) => {
								// Allow unsetting the column count when in auto mode.
								const defaultNewColumnCount = isManualPlacement
									? 1
									: undefined;
								const newColumnCount =
									value === '' || value === '0'
										? defaultNewColumnCount
										: // Only an absent value is not a string.
											parseInt( value as string, 10 );
								onChange( {
									...layout,
									columnCount: newColumnCount,
								} );
							} }
							value={ columnCount ?? '' }
							min={ 1 }
							label={ __( 'Columns' ) }
							hideLabelFromVision={ ! isManualPlacement }
						/>
					</FlexItem>

					<FlexItem isBlock>
						{ allowSizingOnChildren && isManualPlacement ? (
							<NumberControl
								onChange={ ( value ) => {
									// Don't allow unsetting the row count.
									const newRowCount =
										value === '' || value === '0'
											? 1
											: // Only an absent value is not a string.
												parseInt( value as string, 10 );
									onChange( {
										...layout,
										rowCount: newRowCount,
									} );
								} }
								// A `null` count shows an empty field.
								value={ rowCount as number | undefined }
								min={ 1 }
								label={ __( 'Rows' ) }
							/>
						) : (
							<RangeControl
								value={ columnCount ?? 1 }
								onChange={ ( value ) =>
									onChange( {
										...layout,
										columnCount:
											// The string checks are kept from before.
											( value as
												| number
												| string
												| undefined ) === '' ||
											( value as
												| number
												| string
												| undefined ) === '0'
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

// Enables stretching grid columns to fill the available space (auto-fit)
// instead of leaving empty tracks at the end of a row (auto-fill).
function GridLayoutFillControl( { layout, onChange }: LayoutControlProps ) {
	const { autoFit = false } = layout;

	return (
		<ToggleControl
			label={ __( 'Fill available space' ) }
			help={ __(
				'Stretch columns to fill the available space, instead of leaving gaps when there are too few items to fill a row.'
			) }
			checked={ autoFit }
			onChange={ ( value ) =>
				onChange( {
					...layout,
					autoFit: value,
				} )
			}
		/>
	);
}
