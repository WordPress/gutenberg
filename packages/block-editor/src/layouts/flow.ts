import { __ } from '@wordpress/i18n';
import { getBlockGapCSS, getAlignmentsInfo } from './utils';
import { getGapCSSValue } from '../hooks/gap';
import { shouldSkipSerialization } from '../hooks/utils';
import { LAYOUT_DEFINITIONS } from './definitions';
import type { BlockGapValue } from '../hooks/types';
import type { Layout, LayoutAlignment, LayoutStyleArgs } from './types';

export default {
	name: 'default',
	label: __( 'Flow' ),
	hasInspectorControls() {
		return false;
	},
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
	}: LayoutStyleArgs ): string {
		// The `style` attribute is not validated; a string gap reads `top` as undefined.
		const blockGapStyleValue = style?.spacing?.blockGap as
			( BlockGapValue & { top?: string } ) | undefined;

		// If a block's block.json skips serialization for spacing or
		// spacing.blockGap, don't apply the user-defined value to the styles.
		let blockGapValue: string | null = '';
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
	getOrientation(): string {
		return 'vertical';
	},
	getAlignments(
		layout: Layout,
		isBlockBasedTheme?: boolean
	): LayoutAlignment[] {
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

		const alignments: LayoutAlignment[] = [
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
