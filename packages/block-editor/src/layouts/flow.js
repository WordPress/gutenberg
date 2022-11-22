/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getBlockGapCSS, getAlignmentsInfo } from './utils';
import { getGapCSSValue } from '../hooks/gap';
import { shouldSkipSerialization } from '../hooks/utils';
import useSetting from '../components/use-setting';

export default {
	name: 'default',
	label: __( 'Flow' ),
	inspectorControls: function DefaultLayoutInspectorControls( {
		clientId,
		defaultControls = {},
		layout,
		layoutBlockSupport,
		onChange,
	} ) {
		const defaultThemeLayout = useSetting( 'layout' );
		const { allowInheriting = true } = layoutBlockSupport;

		// Only show the inherit toggle if it's supported,
		// a default theme layout is set (e.g. one that provides `contentSize` and/or `wideSize` values),
		// and either the default / flow or the constrained layout type is in use, as the toggle switches from one to the other.
		const showInheritToggle = !! (
			allowInheriting &&
			!! defaultThemeLayout &&
			( ! layout?.type ||
				layout?.type === 'default' ||
				layout?.type === 'constrained' ||
				layout?.inherit )
		);

		return (
			<>
				{ showInheritToggle && (
					<ToolsPanelItem
						label={ __( 'Content layout' ) }
						hasValue={ () => !! layout?.type }
						onDeselect={ () =>
							onChange( {
								...layout,
								type: undefined,
							} )
						}
						isShownByDefault={
							defaultControls?.contentLayout ?? true
						}
						resetAllFilter={ ( newAttributes ) => ( {
							...newAttributes,
							layout: {
								...newAttributes.layout,
								type: undefined,
							},
						} ) }
						panelId={ clientId }
					>
						<ToggleControl
							className="block-editor-hooks__toggle-control"
							label={ __( 'Inner blocks use content width' ) }
							checked={ false }
							onChange={ () =>
								onChange( {
									type: 'constrained',
								} )
							}
							help={ __(
								'Nested blocks will fill the width of this container. Toggle to constrain.'
							) }
						/>
					</ToolsPanelItem>
				) }
			</>
		);
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
	getAlignments( layout ) {
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
		const { contentSize, wideSize } = layout;

		const alignments = [
			{ name: 'left' },
			{ name: 'center' },
			{ name: 'right' },
		];

		if ( contentSize ) {
			alignments.unshift( { name: 'full' } );
		}

		if ( wideSize ) {
			alignments.unshift( { name: 'wide', info: alignmentInfo.wide } );
		}

		alignments.unshift( { name: 'none', info: alignmentInfo.none } );

		return alignments;
	},
};
