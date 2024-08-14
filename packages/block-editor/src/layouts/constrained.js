/**
 * WordPress dependencies
 */
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	positionCenter,
	stretchWide,
	justifyLeft,
	justifyCenter,
	justifyRight,
} from '@wordpress/icons';
import { getCSSRules } from '@wordpress/style-engine';

/**
 * Internal dependencies
 */
import { useSettings } from '../components/use-settings';
import { appendSelectors, getBlockGapCSS, getAlignmentsInfo } from './utils';
import { getGapCSSValue } from '../hooks/gap';
import { BlockControls, JustifyContentControl } from '../components';
import { shouldSkipSerialization } from '../hooks/utils';
import { LAYOUT_DEFINITIONS } from './definitions';

export default {
	name: 'constrained',
	label: __( 'Constrained' ),
	inspectorControls: function DefaultLayoutInspectorControls( {
		layout,
		onChange,
		layoutBlockSupport = {},
	} ) {
		const { wideSize, contentSize, justifyContent = 'center' } = layout;
		const {
			allowJustification = true,
			allowCustomContentAndWideSize = true,
		} = layoutBlockSupport;
		const onJustificationChange = ( value ) => {
			onChange( {
				...layout,
				justifyContent: value,
			} );
		};
		const justificationOptions = [
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
		];
		const [ availableUnits ] = useSettings( 'spacing.units' );
		const units = useCustomUnits( {
			availableUnits: availableUnits || [ '%', 'px', 'em', 'rem', 'vw' ],
		} );
		return (
			<>
				{ allowCustomContentAndWideSize && (
					<>
						<div className="block-editor-hooks__layout-controls">
							<div className="block-editor-hooks__layout-controls-unit">
								<UnitControl
									className="block-editor-hooks__layout-controls-unit-input"
									label={ __( 'Content' ) }
									labelPosition="top"
									__unstableInputWidth="80px"
									value={ contentSize || wideSize || '' }
									onChange={ ( nextWidth ) => {
										nextWidth =
											0 > parseFloat( nextWidth )
												? '0'
												: nextWidth;
										onChange( {
											...layout,
											contentSize: nextWidth,
										} );
									} }
									units={ units }
								/>
								<Icon icon={ positionCenter } />
							</div>
							<div className="block-editor-hooks__layout-controls-unit">
								<UnitControl
									className="block-editor-hooks__layout-controls-unit-input"
									label={ __( 'Wide' ) }
									labelPosition="top"
									__unstableInputWidth="80px"
									value={ wideSize || contentSize || '' }
									onChange={ ( nextWidth ) => {
										nextWidth =
											0 > parseFloat( nextWidth )
												? '0'
												: nextWidth;
										onChange( {
											...layout,
											wideSize: nextWidth,
										} );
									} }
									units={ units }
								/>
								<Icon icon={ stretchWide } />
							</div>
						</div>
						<p className="block-editor-hooks__layout-controls-helptext">
							{ __(
								'Customize the width for all elements that are assigned to the center or wide columns.'
							) }
						</p>
					</>
				) }
				{ allowJustification && (
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Justification' ) }
						value={ justifyContent }
						onChange={ onJustificationChange }
					>
						{ justificationOptions.map(
							( { value, icon, label } ) => {
								return (
									<ToggleGroupControlOptionIcon
										key={ value }
										value={ value }
										icon={ icon }
										label={ label }
									/>
								);
							}
						) }
					</ToggleGroupControl>
				) }
			</>
		);
	},
	toolBarControls: function DefaultLayoutToolbarControls( {
		layout = {},
		onChange,
		layoutBlockSupport,
	} ) {
		const { allowJustification = true } = layoutBlockSupport;

		if ( ! allowJustification ) {
			return null;
		}
		return (
			<BlockControls group="block" __experimentalShareWithChildBlocks>
				<DefaultLayoutJustifyContentControl
					layout={ layout }
					onChange={ onChange }
				/>
			</BlockControls>
		);
	},
	getLayoutStyle: function getLayoutStyle( {
		selector,
		layout = {},
		style,
		blockName,
		hasBlockGapSupport,
		layoutDefinitions = LAYOUT_DEFINITIONS,
	} ) {
		const { contentSize, wideSize, justifyContent } = layout;
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

		const marginLeft =
			justifyContent === 'left' ? '0 !important' : 'auto !important';
		const marginRight =
			justifyContent === 'right' ? '0 !important' : 'auto !important';

		let output =
			!! contentSize || !! wideSize
				? `
					${ appendSelectors(
						selector,
						'> :where(:not(.alignleft):not(.alignright):not(.alignfull))'
					) } {
						max-width: ${ contentSize ?? wideSize };
						margin-left: ${ marginLeft };
						margin-right: ${ marginRight };
					}
					${ appendSelectors( selector, '> .alignwide' ) }  {
						max-width: ${ wideSize ?? contentSize };
					}
					${ appendSelectors( selector, '> .alignfull' ) } {
						max-width: none;
					}
				`
				: '';

		if ( justifyContent === 'left' ) {
			output += `${ appendSelectors(
				selector,
				'> :where(:not(.alignleft):not(.alignright):not(.alignfull))'
			) }
			{ margin-left: ${ marginLeft }; }`;
		} else if ( justifyContent === 'right' ) {
			output += `${ appendSelectors(
				selector,
				'> :where(:not(.alignleft):not(.alignright):not(.alignfull))'
			) }
			{ margin-right: ${ marginRight }; }`;
		}

		// If there is custom padding, add negative margins for alignfull blocks.
		if ( style?.spacing?.padding ) {
			// The style object might be storing a preset so we need to make sure we get a usable value.
			const paddingValues = getCSSRules( style );
			paddingValues.forEach( ( rule ) => {
				if ( rule.key === 'paddingRight' ) {
					// Add unit if 0, to avoid calc(0 * -1) which is invalid.
					const paddingRightValue =
						rule.value === '0' ? '0px' : rule.value;

					output += `
					${ appendSelectors( selector, '> .alignfull' ) } {
						margin-right: calc(${ paddingRightValue } * -1);
					}
					`;
				} else if ( rule.key === 'paddingLeft' ) {
					// Add unit if 0, to avoid calc(0 * -1) which is invalid.
					const paddingLeftValue =
						rule.value === '0' ? '0px' : rule.value;

					output += `
					${ appendSelectors( selector, '> .alignfull' ) } {
						margin-left: calc(${ paddingLeftValue } * -1);
					}
					`;
				}
			} );
		}

		// Output blockGap styles based on rules contained in layout definitions in theme.json.
		if ( hasBlockGapSupport && blockGapValue ) {
			output += getBlockGapCSS(
				selector,
				layoutDefinitions,
				'constrained',
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

const POPOVER_PROPS = {
	placement: 'bottom-start',
};

function DefaultLayoutJustifyContentControl( { layout, onChange } ) {
	const { justifyContent = 'center' } = layout;
	const onJustificationChange = ( value ) => {
		onChange( {
			...layout,
			justifyContent: value,
		} );
	};
	const allowedControls = [ 'left', 'center', 'right' ];

	return (
		<JustifyContentControl
			allowedControls={ allowedControls }
			value={ justifyContent }
			onChange={ onJustificationChange }
			popoverProps={ POPOVER_PROPS }
		/>
	);
}
