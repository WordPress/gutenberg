/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getBlockGapCSS, getAlignmentsInfo } from './utils';
import { getGapCSSValue } from '../hooks/gap';
import { shouldSkipSerialization } from '../hooks/utils';
import { LAYOUT_DEFINITIONS } from './definitions';

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
		layoutDefinitions = LAYOUT_DEFINITIONS,
	} ) {
		const blockGapStyleValue = getGapCSSValue( style?.spacing?.blockGap );

		// If a block's block.json skips serialization for spacing or
		// spacing.blockGap, don't apply the user-defined value to the styles.
		let blockGapValue = '';
		if ( ! shouldSkipSerialization( blockName, 'spacing', 'blockGap' ) ) {
			// If an object is provided only use the 'top' value for this kind of gap.
			if ( blockGapStyleValue?.top ) {
				blockGapValue = getGapCSSValue( blockGapStyleValue?.top );
			} else if ( typeof blockGapStyleValue === 'string' ) {
				blockGapValue = getGapCSSValue( blockGapStyleValue );
			}
		}

		let output = '';

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
	getAlignments( layout, isBlockBasedTheme ) {
		const alignmentInfo = getAlignmentsInfo( layout );
		if ( layout.alignments !== undefined ) {
			if ( ! layout.alignments.includes( 'none' ) ) {
				layout.alignments.unshift( 'none' );
			}
			return layout.alignments.map( ( alignment ) => ( {
				name: alignment,
				info: alignmentInfo[ alignment ],
			} ) );
		}

		const alignments = [
			{ name: 'left' },
			{ name: 'center' },
			{ name: 'right' },
		];

		// This is for backwards compatibility with hybrid themes.
		if ( ! isBlockBasedTheme ) {
			const { contentSize, wideSize } = layout;
			if ( contentSize ) {
				alignments.unshift( { name: 'full' } );
			}

			if ( wideSize ) {
				alignments.unshift( {
					name: 'wide',
					info: alignmentInfo.wide,
				} );
			}
		}

		alignments.unshift( { name: 'none', info: alignmentInfo.none } );

		return alignments;
	},
};
