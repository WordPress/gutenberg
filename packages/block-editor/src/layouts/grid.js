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
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { appendSelectors, getBlockGapCSS } from './utils';
import { getGapCSSValue } from '../hooks/gap';
import { shouldSkipSerialization } from '../hooks/utils';
import { LAYOUT_DEFINITIONS } from './definitions';
import {
	GridVisualizer,
	useGridLayoutSync,
} from '../components/grid-visualizer';

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
		return (
			<>
				<GridLayoutTypeControl
					layout={ layout }
					onChange={ onChange }
				/>
				{ layout?.columnCount ? (
					<GridLayoutColumnsAndRowsControl
						layout={ layout }
						onChange={ onChange }
						allowSizingOnChildren={ allowSizingOnChildren }
					/>
				) : (
					<GridLayoutMinimumWidthControl
						layout={ layout }
						onChange={ onChange }
					/>
				) }
			</>
		);
	},
	toolBarControls: function GridLayoutToolbarControls( { clientId } ) {
		return (
			<>
				{ window.__experimentalEnableGridInteractivity && (
					<GridLayoutSync clientId={ clientId } />
				) }
				<GridVisualizer clientId={ clientId } />
			</>
		);
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
			minimumColumnWidth = '12rem',
			columnCount = null,
			rowCount = null,
		} = layout;

		// If a block's block.json skips serialization for spacing or spacing.blockGap,
		// don't apply the user-defined value to the styles.
		const blockGapValue =
			style?.spacing?.blockGap &&
			! shouldSkipSerialization( blockName, 'spacing', 'blockGap' )
				? getGapCSSValue( style?.spacing?.blockGap, '0.5em' )
				: undefined;

		let output = '';
		const rules = [];

		if ( columnCount ) {
			rules.push(
				`grid-template-columns: repeat(${ columnCount }, minmax(0, 1fr))`
			);
			if ( rowCount ) {
				rules.push(
					`grid-template-rows: repeat(${ rowCount }, minmax(0, 1fr))`
				);
			}
		} else if ( minimumColumnWidth ) {
			rules.push(
				`grid-template-columns: repeat(auto-fill, minmax(min(${ minimumColumnWidth }, 100%), 1fr))`,
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
	const { minimumColumnWidth: value = '12rem' } = layout;
	const [ quantity, unit ] = parseQuantityAndUnitFromRawValue( value );

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
								minimumColumnWidth: newValue,
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
						onChange={ handleSliderChange }
						value={ quantity }
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
	const { columnCount = 3, rowCount } = layout;

	return (
		<>
			<fieldset>
				<Flex gap={ 4 }>
					<FlexItem isBlock>
						<NumberControl
							size="__unstable-large"
							onChange={ ( value ) => {
								/**
								 * If the input is cleared, avoid switching
								 * back to "Auto" by setting a value of "1".
								 */
								const validValue = value !== '' ? value : '1';
								onChange( {
									...layout,
									columnCount: validValue,
								} );
							} }
							value={ columnCount }
							min={ 1 }
							label={ __( 'Columns' ) }
						/>
					</FlexItem>

					<FlexItem isBlock>
						{ window.__experimentalEnableGridInteractivity &&
						allowSizingOnChildren ? (
							<NumberControl
								size="__unstable-large"
								onChange={ ( value ) => {
									onChange( {
										...layout,
										rowCount: value,
									} );
								} }
								value={ rowCount }
								min={ 1 }
								label={ __( 'Rows' ) }
							/>
						) : (
							<RangeControl
								value={ parseInt( columnCount, 10 ) } // RangeControl can't deal with strings.
								onChange={ ( value ) =>
									onChange( {
										...layout,
										columnCount: value,
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
	const { columnCount, minimumColumnWidth } = layout;

	/**
	 * When switching, temporarily save any custom values set on the
	 * previous type so we can switch back without loss.
	 */
	const [ tempColumnCount, setTempColumnCount ] = useState(
		columnCount || 3
	);
	const [ tempMinimumColumnWidth, setTempMinimumColumnWidth ] = useState(
		minimumColumnWidth || '12rem'
	);

	const isManual = !! columnCount ? 'manual' : 'auto';

	const onChangeType = ( value ) => {
		if ( value === 'manual' ) {
			setTempMinimumColumnWidth( minimumColumnWidth || '12rem' );
		} else {
			setTempColumnCount( columnCount || 3 );
		}
		onChange( {
			...layout,
			columnCount: value === 'manual' ? tempColumnCount : null,
			minimumColumnWidth:
				value === 'auto' ? tempMinimumColumnWidth : null,
		} );
	};

	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			label={ __( 'Grid item position' ) }
			value={ isManual }
			onChange={ onChangeType }
			isBlock
			help={
				isManual === 'manual'
					? __(
							'Grid items can be manually placed in any position on the grid.'
					  )
					: __(
							'Grid items are placed automatically depending on their order.'
					  )
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

function GridLayoutSync( props ) {
	useGridLayoutSync( props );
}
