/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import {
	Flex,
	FlexItem,
	RangeControl,
	ToggleControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { appendSelectors, getBlockGapCSS } from './utils';
import { getGapCSSValue } from '../hooks/gap';
import { shouldSkipSerialization } from '../hooks/utils';

export default {
	name: 'grid',
	label: __( 'Grid' ),
	inspectorControls: function GridLayoutInspectorControls( {
		layout = {},
		onChange,
	} ) {
		const { isResponsive = true } = layout;

		return (
			<>
				<Flex direction="column">
					<FlexItem>
						<GridLayoutResponsiveControl
							layout={ layout }
							onChange={ onChange }
						/>
					</FlexItem>
					{ isResponsive && (
						<FlexItem>
							<GridLayoutMinimumWidthControl
								layout={ layout }
								onChange={ onChange }
							/>
						</FlexItem>
					) }
					{ ! isResponsive && (
						<FlexItem>
							<GridLayoutColumnsControl
								layout={ layout }
								onChange={ onChange }
							/>
						</FlexItem>
					) }
				</Flex>
			</>
		);
	},
	toolBarControls: function DefaultLayoutToolbarControls() {
		return null;
	},
	getLayoutStyle: function getLayoutStyle( {
		selector,
		layout,
		style,
		blockName,
		hasBlockGapSupport,
		layoutDefinitions,
	} ) {
		const {
			isResponsive = true,
			minimumColumnWidth = '12rem',
			numberOfColumns = 3,
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

		if ( isResponsive && minimumColumnWidth ) {
			rules.push(
				`grid-template-columns: repeat(auto-fill, minmax(${ minimumColumnWidth }, 1fr))`
			);
		} else if ( numberOfColumns ) {
			rules.push(
				`grid-template-columns: repeat(${ numberOfColumns }, 1fr)`
			);
		}

		if ( rules.length ) {
			output = `${ appendSelectors( selector ) } {
				${ rules.join( '; ' ) };
			}`;
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
		return null;
	},
	getAlignments() {
		return [];
	},
};

// Enables setting minimum width of grid items.
function GridLayoutMinimumWidthControl( { layout, onChange } ) {
	const { minimumColumnWidth = '20rem' } = layout;

	return (
		<UnitControl
			size={ '__unstable-large' }
			label={ __( 'Minimum column width ' ) }
			onChange={ ( value ) => {
				onChange( {
					...layout,
					minimumColumnWidth: value,
				} );
			} }
			value={ minimumColumnWidth }
		/>
	);
}

// Enables setting number of grid columns
function GridLayoutColumnsControl( { layout, onChange } ) {
	const { numberOfColumns = 3 } = layout;

	return (
		<RangeControl
			label={ __( 'Columns' ) }
			value={ numberOfColumns }
			onChange={ ( value ) => {
				onChange( {
					...layout,
					numberOfColumns: value,
				} );
			} }
			min={ 1 }
			max={ 12 }
		/>
	);
}

// Toggle between responsive and fixed column grid.
function GridLayoutResponsiveControl( { layout, onChange } ) {
	const { isResponsive = true } = layout;

	return (
		<ToggleControl
			label={ __( 'Responsive' ) }
			checked={ isResponsive }
			onChange={ () => {
				onChange( {
					...layout,
					isResponsive: ! isResponsive,
				} );
			} }
		/>
	);
}
