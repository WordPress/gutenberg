/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, positionCenter, stretchWide } from '@wordpress/icons';
import { getCSSRules } from '@wordpress/style-engine';

/**
 * Internal dependencies
 */
import useSetting from '../components/use-setting';
import { appendSelectors, getBlockGapCSS } from './utils';
import { getGapBoxControlValueFromStyle } from '../hooks/gap';
import { shouldSkipSerialization } from '../hooks/utils';

export default {
	name: 'column',
	label: __( 'Column' ),
	inspectorControls: function DefaultLayoutInspectorControls( {
		layout,
		onChange,
	} ) {
		const { wideSize, contentSize } = layout;
		const units = useCustomUnits( {
			availableUnits: useSetting( 'spacing.units' ) || [
				'%',
				'px',
				'em',
				'rem',
				'vw',
			],
		} );

		return (
			<>
				<div className="block-editor-hooks__layout-controls">
					<div className="block-editor-hooks__layout-controls-unit">
						<UnitControl
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
				<div className="block-editor-hooks__layout-controls-reset">
					<Button
						variant="secondary"
						isSmall
						disabled={ ! contentSize && ! wideSize }
						onClick={ () =>
							onChange( {
								contentSize: undefined,
								wideSize: undefined,
								inherit: false,
							} )
						}
					>
						{ __( 'Reset' ) }
					</Button>
				</div>

				<p className="block-editor-hooks__layout-controls-helptext">
					{ __(
						'Customize the width for all elements that are assigned to the center or wide columns.'
					) }
				</p>
			</>
		);
	},
	toolBarControls: function DefaultLayoutToolbarControls() {
		return null;
	},
	getLayoutStyle: function getLayoutStyle( {
		selector,
		layout = {},
		style,
		blockName,
		hasBlockGapSupport,
		layoutDefinitions,
	} ) {
		const { contentSize, wideSize } = layout;
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

		let output =
			!! contentSize || !! wideSize
				? `
					${ appendSelectors(
						selector,
						'> :where(:not(.alignleft):not(.alignright):not(.alignfull))'
					) } {
						max-width: ${ contentSize ?? wideSize };
						margin-left: auto !important;
						margin-right: auto !important;
					}
					${ appendSelectors( selector, '> .alignwide' ) }  {
						max-width: ${ wideSize ?? contentSize };
					}
					${ appendSelectors( selector, '> .alignfull' ) } {
						max-width: none;
					}
				`
				: '';

		// If there is custom padding, add negative margins for alignfull blocks.
		if ( style?.spacing?.padding ) {
			// The style object might be storing a preset so we need to make sure we get a usable value.
			const paddingValues = getCSSRules( style );
			paddingValues.forEach( ( rule ) => {
				if ( rule.key === 'paddingRight' ) {
					output += `
					${ appendSelectors( selector, '> .alignfull' ) } {
						margin-right: calc(${ rule.value } * -1);
					}
					`;
				} else if ( rule.key === 'paddingLeft' ) {
					output += `
					${ appendSelectors( selector, '> .alignfull' ) } {
						margin-left: calc(${ rule.value } * -1);
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
				'column',
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

/**
 * Helper method to assign contextual info to clarify
 * alignment settings.
 *
 * Besides checking if `contentSize` and `wideSize` have a
 * value, we now show this information only if their values
 * are not a `css var`. This needs to change when parsing
 * css variables land.
 *
 * @see https://github.com/WordPress/gutenberg/pull/34710#issuecomment-918000752
 *
 * @param {Object} layout The layout object.
 * @return {Object} An object with contextual info per alignment.
 */
function getAlignmentsInfo( layout ) {
	const { contentSize, wideSize } = layout;
	const alignmentInfo = {};
	const sizeRegex = /^(?!0)\d+(px|em|rem|vw|vh|%)?$/i;
	if ( sizeRegex.test( contentSize ) ) {
		// translators: %s: container size (i.e. 600px etc)
		alignmentInfo.none = sprintf( __( 'Max %s wide' ), contentSize );
	}
	if ( sizeRegex.test( wideSize ) ) {
		// translators: %s: container size (i.e. 600px etc)
		alignmentInfo.wide = sprintf( __( 'Max %s wide' ), wideSize );
	}
	return alignmentInfo;
}
