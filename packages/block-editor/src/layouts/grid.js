/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import {
	BaseControl,
	Flex,
	FlexItem,
	RangeControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { appendSelectors, getBlockGapCSS } from './utils';
import { getGapCSSValue } from '../hooks/gap';
import { shouldSkipSerialization } from '../hooks/utils';
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

export default {
	name: 'grid',
	label: __( 'Grid' ),
	inspectorControls: function GridLayoutInspectorControls( {
		layout = {},
		onChange,
		layoutBlockSupport = {},
	} ) {
		const { allowSizingOnChildren = false } = layoutBlockSupport;

		// In the experiment we want to also show column control in Auto mode, and
		// the minimum width control in Manual mode.
		const showColumnsControl =
			window.__experimentalEnableGridInteractivity ||
			!! layout?.columnCount;
		const showMinWidthControl =
			window.__experimentalEnableGridInteractivity ||
			! layout?.columnCount;
		return (
			<>
				<GridLayoutTypeControl
					layout={ layout }
					onChange={ onChange }
				/>
				<VStack spacing={ 4 }>
					{ showColumnsControl && (
						<GridLayoutColumnsAndRowsControl
							layout={ layout }
							onChange={ onChange }
							allowSizingOnChildren={ allowSizingOnChildren }
						/>
					) }
					{ showMinWidthControl && (
						<GridLayoutMinimumWidthControl
							layout={ layout }
							onChange={ onChange }
						/>
					) }
				</VStack>
			</>
		);
	},
	toolBarControls: function GridLayoutToolbarControls() {
		return null;
	},
	getLayoutStyle: function getLayoutStyle( {
		selector,
		layout,
		style,
		blockName,
		hasBlockGapSupport,
		layoutDefinitions = LAYOUT_DEFINITIONS,
	} ) {
		const {
			minimumColumnWidth = null,
			columnCount = null,
			rowCount = null,
		} = layout;

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

		// If a block's block.json skips serialization for spacing or spacing.blockGap,
		// don't apply the user-defined value to the styles.
		const blockGapValue =
			style?.spacing?.blockGap &&
			! shouldSkipSerialization( blockName, 'spacing', 'blockGap' )
				? getGapCSSValue( style?.spacing?.blockGap, '0.5em' )
				: undefined;

		let output = '';
		const rules = [];

		if ( minimumColumnWidth && columnCount > 0 ) {
			const maxValue = `max(${ minimumColumnWidth }, ( 100% - (${
				blockGapValue || '1.2rem'
			}*${ columnCount - 1 }) ) / ${ columnCount })`;
			rules.push(
				`grid-template-columns: repeat(auto-fill, minmax(${ maxValue }, 1fr))`,
				`container-type: inline-size`
			);
			if ( rowCount ) {
				rules.push(
					`grid-template-rows: repeat(${ rowCount }, minmax(1rem, auto))`
				);
			}
		} else if ( columnCount ) {
			rules.push(
				`grid-template-columns: repeat(${ columnCount }, minmax(0, 1fr))`
			);
			if ( rowCount ) {
				rules.push(
					`grid-template-rows: repeat(${ rowCount }, minmax(1rem, auto))`
				);
			}
		} else {
			rules.push(
				`grid-template-columns: repeat(auto-fill, minmax(min(${
					minimumColumnWidth || '12rem'
				}, 100%), 1fr))`,
				'container-type: inline-size'
			);
		}

		if ( rules.length ) {
			// Reason to disable: the extra line breaks added by prettier mess with the unit tests.
			// eslint-disable-next-line prettier/prettier
			output = `${ appendSelectors( selector ) } { ${ rules.join(
				'; '
			) }; }`;
		}

		// Output blockGap styles based on rules contained in layout definitions in theme.json.
		if ( hasBlockGapSupport && blockGapValue ) {
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
		<fieldset>
			<BaseControl.VisualLabel as="legend">
				{ __( 'Minimum column width' ) }
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
						__nextHasNoMarginBottom
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
		</fieldset>
	);
}

// Enables setting number of grid columns
function GridLayoutColumnsAndRowsControl( {
	layout,
	onChange,
	allowSizingOnChildren,
} ) {
	// If the grid interactivity experiment is enabled, allow unsetting the column count.
	const defaultColumnCount = window.__experimentalEnableGridInteractivity
		? undefined
		: 3;
	const {
		columnCount = defaultColumnCount,
		rowCount,
		isManualPlacement,
	} = layout;

	return (
		<>
			<fieldset>
				{ ( ! window.__experimentalEnableGridInteractivity ||
					! isManualPlacement ) && (
					<BaseControl.VisualLabel as="legend">
						{ __( 'Columns' ) }
					</BaseControl.VisualLabel>
				) }
				<Flex gap={ 4 }>
					<FlexItem isBlock>
						<NumberControl
							size="__unstable-large"
							onChange={ ( value ) => {
								if (
									window.__experimentalEnableGridInteractivity
								) {
									// Allow unsetting the column count when in auto mode.
									const defaultNewColumnCount =
										isManualPlacement ? 1 : undefined;
									const newColumnCount =
										value === '' || value === '0'
											? defaultNewColumnCount
											: parseInt( value, 10 );
									onChange( {
										...layout,
										columnCount: newColumnCount,
									} );
								} else {
									// Don't allow unsetting the column count.
									const newColumnCount =
										value === '' || value === '0'
											? 1
											: parseInt( value, 10 );
									onChange( {
										...layout,
										columnCount: newColumnCount,
									} );
								}
							} }
							value={ columnCount }
							min={ 1 }
							label={ __( 'Columns' ) }
							hideLabelFromVision={
								! window.__experimentalEnableGridInteractivity ||
								! isManualPlacement
							}
						/>
					</FlexItem>

					<FlexItem isBlock>
						{ window.__experimentalEnableGridInteractivity &&
						allowSizingOnChildren &&
						isManualPlacement ? (
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
								__nextHasNoMarginBottom
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

	const gridPlacement =
		isManualPlacement ||
		( !! columnCount && ! window.__experimentalEnableGridInteractivity )
			? 'manual'
			: 'auto';

	const onChangeType = ( value ) => {
		if ( value === 'manual' ) {
			setTempMinimumColumnWidth( minimumColumnWidth || '12rem' );
		} else {
			setTempColumnCount( columnCount || 3 );
			setTempRowCount( rowCount );
		}
		onChange( {
			...layout,
			columnCount: value === 'manual' ? tempColumnCount : null,
			rowCount:
				value === 'manual' &&
				window.__experimentalEnableGridInteractivity
					? tempRowCount
					: undefined,
			isManualPlacement:
				value === 'manual' &&
				window.__experimentalEnableGridInteractivity
					? true
					: undefined,
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
			__nextHasNoMarginBottom
			label={ __( 'Grid item position' ) }
			value={ gridPlacement }
			onChange={ onChangeType }
			isBlock
			help={
				window.__experimentalEnableGridInteractivity
					? helpText
					: undefined
			}
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
