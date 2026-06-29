/**
 * WordPress dependencies
 */
import {
	__experimentalUseCustomUnits as useCustomUnits,
	__experimentalUnitControl as UnitControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	Icon,
	alignNone,
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
import { cleanEmptyObject, shouldSkipSerialization } from '../hooks/utils';
import { LAYOUT_DEFINITIONS } from './definitions';

const GLOBAL_CONTENT_SIZE = 'var(--wp--style--global--content-size, none)';
const GLOBAL_WIDE_SIZE = 'var(--wp--style--global--wide-size, none)';

export default {
	name: 'constrained',
	label: __( 'Constrained' ),
	inspectorControls: function DefaultLayoutInspectorControls( {
		layout,
		onChange,
		layoutBlockSupport = {},
		resetLayout = {},
		clientId,
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
		const hasLayoutValue = ( key, defaultValue ) =>
			( layout?.[ key ] ?? defaultValue ) !==
			( resetLayout?.[ key ] ?? defaultValue );
		const resetContentSize = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					contentSize: resetLayout?.contentSize,
				} )
			);
		const resetWideSize = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					wideSize: resetLayout?.wideSize,
				} )
			);
		const resetJustification = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					justifyContent: resetLayout?.justifyContent,
				} )
			);
		const hasContentSizeValue = () => hasLayoutValue( 'contentSize' );
		const hasWideSizeValue = () => hasLayoutValue( 'wideSize' );
		const hasJustificationValue = () =>
			hasLayoutValue( 'justifyContent', 'center' );

		return (
			<>
				{ allowCustomContentAndWideSize && (
					<>
						<ToolsPanelItem
							label={ __( 'Content width' ) }
							hasValue={ hasContentSizeValue }
							onDeselect={ resetContentSize }
							panelId={ clientId }
						>
							<UnitControl
								__next40pxDefaultSize
								label={ __( 'Content width' ) }
								labelPosition="top"
								value={
									contentSize === null
										? ''
										: contentSize || wideSize || ''
								}
								onChange={ ( nextWidth ) => {
									nextWidth =
										0 > parseFloat( nextWidth )
											? '0'
											: nextWidth;
									onChange( {
										...layout,
										contentSize:
											nextWidth !== ''
												? nextWidth
												: undefined,
									} );
								} }
								units={ units }
								prefix={
									<InputControlPrefixWrapper variant="icon">
										<Icon icon={ alignNone } />
									</InputControlPrefixWrapper>
								}
							/>
						</ToolsPanelItem>
						<ToolsPanelItem
							label={ __( 'Wide width' ) }
							hasValue={ hasWideSizeValue }
							onDeselect={ resetWideSize }
							panelId={ clientId }
						>
							<UnitControl
								__next40pxDefaultSize
								label={ __( 'Wide width' ) }
								labelPosition="top"
								value={
									wideSize === null
										? ''
										: wideSize || contentSize || ''
								}
								onChange={ ( nextWidth ) => {
									nextWidth =
										0 > parseFloat( nextWidth )
											? '0'
											: nextWidth;
									onChange( {
										...layout,
										wideSize:
											nextWidth !== ''
												? nextWidth
												: undefined,
									} );
								} }
								units={ units }
								prefix={
									<InputControlPrefixWrapper variant="icon">
										<Icon icon={ stretchWide } />
									</InputControlPrefixWrapper>
								}
							/>
							<p className="block-editor-hooks__layout-constrained-helptext">
								{ __(
									'Customize the width for all elements that are assigned to the center or wide columns.'
								) }
							</p>
						</ToolsPanelItem>
					</>
				) }
				{ allowJustification && (
					<ToolsPanelItem
						label={ __( 'Justification' ) }
						hasValue={ hasJustificationValue }
						onDeselect={ resetJustification }
						panelId={ clientId }
					>
						<ToggleGroupControl
							__next40pxDefaultSize
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
					</ToolsPanelItem>
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
		viewportOverrides,
		style,
		blockName,
		hasBlockGapSupport,
		layoutDefinitions = LAYOUT_DEFINITIONS,
	} ) {
		const hasViewportOverrides = viewportOverrides !== undefined;
		const effectiveLayout = hasViewportOverrides
			? { ...layout, ...viewportOverrides }
			: layout;
		const hasViewportOverride = ( key ) =>
			Object.hasOwn( viewportOverrides || {}, key );
		const { contentSize, wideSize, justifyContent } = effectiveLayout;
		const blockGapStyleValue = getGapCSSValue( style?.spacing?.blockGap );
		const hasBlockGapOverride =
			! hasViewportOverrides ||
			Object.hasOwn( style?.spacing || {}, 'blockGap' );
		const hasBlockSpacingOverride =
			! hasViewportOverrides ||
			Object.hasOwn( style?.spacing || {}, 'padding' );

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

		const hasJustificationOverride =
			hasViewportOverrides && hasViewportOverride( 'justifyContent' );
		const hasContentSizeOverride =
			hasViewportOverrides && hasViewportOverride( 'contentSize' );
		const hasWideSizeOverride =
			hasViewportOverrides && hasViewportOverride( 'wideSize' );
		const shouldOutputConstrainedSizes =
			! hasViewportOverrides ||
			hasContentSizeOverride ||
			hasWideSizeOverride;
		const isResettingConstrainedSizes =
			hasViewportOverrides &&
			( ( hasContentSizeOverride && ! contentSize ) ||
				( hasWideSizeOverride && ! wideSize ) );
		const contentMaxWidth =
			contentSize ||
			( wideSize && ! hasContentSizeOverride
				? wideSize
				: GLOBAL_CONTENT_SIZE );
		const wideMaxWidth =
			wideSize ||
			( contentSize && ! hasWideSizeOverride
				? contentSize
				: GLOBAL_WIDE_SIZE );
		const constrainedSizeDeclarations = [
			`max-width: ${ contentMaxWidth }`,
		];
		if ( ! hasViewportOverrides || hasJustificationOverride ) {
			constrainedSizeDeclarations.push(
				`margin-left: ${ marginLeft }`,
				`margin-right: ${ marginRight }`
			);
		}
		let output =
			shouldOutputConstrainedSizes &&
			( !! contentSize || !! wideSize || isResettingConstrainedSizes )
				? `
						${ appendSelectors(
							selector,
							'> :where(:not(.alignleft):not(.alignright):not(.alignfull))'
						) } {
						${ constrainedSizeDeclarations.join( '; ' ) };
					}
					${ appendSelectors( selector, '> .alignwide' ) }  {
						max-width: ${ wideMaxWidth };
					}
					${ appendSelectors( selector, '> .alignfull' ) } {
						max-width: none;
					}
					`
				: '';

		if ( hasJustificationOverride && ! shouldOutputConstrainedSizes ) {
			output += `${ appendSelectors(
				selector,
				'> :where(:not(.alignleft):not(.alignright):not(.alignfull))'
			) }
				{ margin-left: ${ marginLeft }; margin-right: ${ marginRight }; }`;
		} else if ( ! hasViewportOverrides ) {
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
		}

		// If there is custom padding, add negative margins for alignfull blocks.
		if ( hasBlockSpacingOverride && style?.spacing?.padding ) {
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
		if ( hasBlockGapSupport && hasBlockGapOverride && blockGapValue ) {
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
