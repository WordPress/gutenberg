/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import {
	Flex,
	FlexItem,
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
		return (
			<>
				<Flex direction="column">
					<FlexItem>
						<GridLayoutMinimumWidthControl
							layout={ layout }
							onChange={ onChange }
						/>
					</FlexItem>
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
		const { minimumColumnWidth = '12rem' } = layout;

		// If a block's block.json skips serialization for spacing or spacing.blockGap,
		// don't apply the user-defined value to the styles.
		const blockGapValue =
			style?.spacing?.blockGap &&
			! shouldSkipSerialization( blockName, 'spacing', 'blockGap' )
				? getGapCSSValue( style?.spacing?.blockGap, '0.5em' )
				: undefined;

		let output = '';
		const rules = [];

		if ( minimumColumnWidth ) {
			rules.push(
				`grid-template-columns: repeat(auto-fill, minmax(${ minimumColumnWidth }, 1fr))`
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
