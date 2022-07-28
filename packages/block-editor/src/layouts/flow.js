/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { getBlockGapCSS } from './utils';
import { getGapBoxControlValueFromStyle } from '../hooks/gap';
import { shouldSkipSerialization } from '../hooks/utils';

export default {
	name: 'default',
	label: __( 'Flow' ),
	inspectorControls: function DefaultLayoutInspectorControls() {
		return null;
	},
	toolBarControls: function DefaultLayoutToolbarControls() {
		return null;
	},
	getLayoutStyle: function getLayoutStyle( {
		selector,
		style,
		blockName,
		hasBlockGapSupport,
		layoutDefinitions,
	} ) {
		const blockGapStyleValue = getGapBoxControlValueFromStyle(
			style?.spacing?.blockGap
		);
		// If a block's block.json skips serialization for spacing or
		// spacing.blockGap, don't apply the user-defined value to the styles.
		const blockGapValue =
			blockGapStyleValue?.top &&
			! shouldSkipSerialization( blockName, 'spacing', 'blockGap' )
				? blockGapStyleValue?.top
				: '';

		let output;

		// Output blockGap styles based on rules contained in layout definitions in theme.json.
		if ( hasBlockGapSupport && blockGapValue ) {
			output += getBlockGapCSS(
				selector,
				layoutDefinitions,
				'default',
				blockGapValue
			);
		}
		return output;
	},
	getOrientation() {
		return 'vertical';
	},
	getAlignments() {
		return [];
	},
};
