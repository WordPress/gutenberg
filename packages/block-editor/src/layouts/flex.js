/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	justifyLeft,
	justifyCenter,
	justifyRight,
	justifySpaceBetween,
	justifyStretch,
	arrowRight,
	arrowDown,
} from '@wordpress/icons';
import {
	Flex,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { appendSelectors, getBlockGapCSS } from './utils';
import { getGapCSSValue, getGapBoxControlValueFromStyle } from '../hooks/gap';
import { getSpacingPresetCssVar } from '../components/spacing-sizes-control/utils';
import {
	BlockControls,
	JustifyContentControl,
	BlockVerticalAlignmentControl,
} from '../components';
import { cleanEmptyObject, shouldSkipSerialization } from '../hooks/utils';
import { LAYOUT_DEFINITIONS } from './definitions';

// Used with the default, horizontal flex orientation.
const justifyContentMap = {
	left: 'flex-start',
	right: 'flex-end',
	center: 'center',
	'space-between': 'space-between',
};

// Used with the vertical (column) flex orientation.
const alignItemsMap = {
	left: 'flex-start',
	right: 'flex-end',
	center: 'center',
	stretch: 'stretch',
};

const verticalAlignmentMap = {
	top: 'flex-start',
	center: 'center',
	bottom: 'flex-end',
	stretch: 'stretch',
	'space-between': 'space-between',
};

const defaultAlignments = {
	horizontal: 'center',
	vertical: 'top',
};

const flexWrapOptions = [ 'wrap', 'nowrap' ];

export default {
	name: 'flex',
	label: __( 'Flex' ),
	inspectorControls: function FlexLayoutInspectorControls( {
		layout = {},
		onChange,
		layoutBlockSupport = {},
		resetLayout = {},
		clientId,
	} ) {
		const {
			allowOrientation = true,
			allowJustification = true,
			allowWrap = true,
		} = layoutBlockSupport;
		const hasLayoutValue = ( key, defaultValue ) =>
			( layout?.[ key ] ?? defaultValue ) !==
			( resetLayout?.[ key ] ?? defaultValue );
		const hasJustificationValue = () =>
			hasLayoutValue( 'justifyContent', 'left' );
		const hasOrientationValue = () =>
			hasLayoutValue( 'orientation', 'horizontal' );
		const hasWrapValue = () => hasLayoutValue( 'flexWrap', 'wrap' );
		const resetJustification = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					justifyContent: resetLayout?.justifyContent,
				} )
			);
		const resetOrientation = () => {
			const { verticalAlignment, justifyContent } = layout;
			const nextOrientation = resetLayout?.orientation;
			const isHorizontal =
				! nextOrientation || nextOrientation === 'horizontal';
			onChange(
				cleanEmptyObject( {
					...layout,
					orientation: nextOrientation,
					verticalAlignment:
						resetLayout?.verticalAlignment ??
						( isHorizontal && verticalAlignment === 'space-between'
							? 'center'
							: verticalAlignment ),
					justifyContent:
						resetLayout?.justifyContent ??
						( isHorizontal && justifyContent === 'stretch'
							? 'left'
							: justifyContent ),
				} )
			);
		};
		const resetWrap = () =>
			onChange(
				cleanEmptyObject( {
					...layout,
					flexWrap: resetLayout?.flexWrap,
				} )
			);

		return (
			<>
				{ ( allowJustification || allowOrientation ) && (
					<Flex
						align="flex-start"
						className="block-editor-hooks__flex-layout-controls"
						gap={ 4 }
						justify="flex-start"
					>
						{ allowJustification && (
							<ToolsPanelItem
								label={ __( 'Justification' ) }
								hasValue={ hasJustificationValue }
								onDeselect={ resetJustification }
								isShownByDefault
								panelId={ clientId }
							>
								<FlexLayoutJustifyContentControl
									layout={ layout }
									onChange={ onChange }
								/>
							</ToolsPanelItem>
						) }
						{ allowOrientation && (
							<ToolsPanelItem
								label={ __( 'Orientation' ) }
								hasValue={ hasOrientationValue }
								onDeselect={ resetOrientation }
								isShownByDefault
								panelId={ clientId }
							>
								<OrientationControl
									layout={ layout }
									onChange={ onChange }
								/>
							</ToolsPanelItem>
						) }
					</Flex>
				) }
				{ allowWrap && (
					<ToolsPanelItem
						label={ __( 'Wrapping' ) }
						hasValue={ hasWrapValue }
						onDeselect={ resetWrap }
						panelId={ clientId }
					>
						<FlexWrapControl
							layout={ layout }
							onChange={ onChange }
						/>
					</ToolsPanelItem>
				) }
			</>
		);
	},
	toolBarControls: function FlexLayoutToolbarControls( {
		layout = {},
		onChange,
		layoutBlockSupport,
	} ) {
		const { allowVerticalAlignment = true, allowJustification = true } =
			layoutBlockSupport;

		if ( ! allowJustification && ! allowVerticalAlignment ) {
			return null;
		}

		return (
			<BlockControls group="block" __experimentalShareWithChildBlocks>
				{ allowJustification && (
					<FlexLayoutJustifyContentControl
						layout={ layout }
						onChange={ onChange }
						isToolbar
					/>
				) }
				{ allowVerticalAlignment && (
					<FlexLayoutVerticalAlignmentControl
						layout={ layout }
						onChange={ onChange }
					/>
				) }
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
		globalBlockGapValue,
		layoutDefinitions = LAYOUT_DEFINITIONS,
	} ) {
		const hasViewportOverrides = viewportOverrides !== undefined;
		const effectiveLayout = hasViewportOverrides
			? { ...layout, ...viewportOverrides }
			: layout;
		const hasViewportOverride = ( key ) =>
			Object.hasOwn( viewportOverrides || {}, key );
		const { orientation = 'horizontal' } = effectiveLayout;

		// Determine the fallback gap value using global styles (theme.json),
		// falling back to '0.5em' for backwards compatibility.
		let fallbackGapValue = '0.5em';
		if ( globalBlockGapValue ) {
			const gapBox =
				getGapBoxControlValueFromStyle( globalBlockGapValue );
			fallbackGapValue =
				getSpacingPresetCssVar( gapBox?.left ) ||
				getSpacingPresetCssVar( gapBox?.top ) ||
				'0.5em';
		}

		// If a block's block.json skips serialization for spacing or spacing.blockGap,
		// don't apply the user-defined value to the styles.
		const blockGapValue =
			style?.spacing?.blockGap &&
			! shouldSkipSerialization( blockName, 'spacing', 'blockGap' )
				? getGapCSSValue( style?.spacing?.blockGap, fallbackGapValue )
				: undefined;
		const hasBlockGapOverride =
			! hasViewportOverrides ||
			Object.hasOwn( style?.spacing || {}, 'blockGap' );
		const justifyContent =
			justifyContentMap[ effectiveLayout.justifyContent ];
		const flexWrap = flexWrapOptions.includes( effectiveLayout.flexWrap )
			? effectiveLayout.flexWrap
			: 'wrap';
		const verticalAlignment =
			verticalAlignmentMap[ effectiveLayout.verticalAlignment ];
		const alignItems =
			alignItemsMap[ effectiveLayout.justifyContent ] ||
			alignItemsMap.left;

		let output = '';
		const rules = [];

		const shouldOutputFlexWrap =
			! hasViewportOverrides || hasViewportOverride( 'flexWrap' );
		const shouldOutputFlexOrientation =
			! hasViewportOverrides || hasViewportOverride( 'orientation' );
		const shouldOutputFlexJustification =
			! hasViewportOverrides ||
			hasViewportOverride( 'justifyContent' ) ||
			hasViewportOverride( 'orientation' );
		const shouldOutputFlexAlignment =
			! hasViewportOverrides ||
			hasViewportOverride( 'verticalAlignment' ) ||
			hasViewportOverride( 'orientation' );

		if ( shouldOutputFlexWrap && flexWrap && flexWrap !== 'wrap' ) {
			rules.push( `flex-wrap: ${ flexWrap }` );
		}

		if ( orientation === 'horizontal' ) {
			if ( shouldOutputFlexAlignment && verticalAlignment ) {
				rules.push( `align-items: ${ verticalAlignment }` );
			}
			if ( shouldOutputFlexJustification && justifyContent ) {
				rules.push( `justify-content: ${ justifyContent }` );
			}
		} else {
			if ( shouldOutputFlexAlignment && verticalAlignment ) {
				rules.push( `justify-content: ${ verticalAlignment }` );
			}
			if ( shouldOutputFlexOrientation ) {
				rules.push( 'flex-direction: column' );
			}
			if ( shouldOutputFlexJustification ) {
				rules.push( `align-items: ${ alignItems }` );
			}
		}

		if ( rules.length ) {
			output = `${ appendSelectors( selector ) } {
				${ rules.join( '; ' ) };
			}`;
		}

		// Output blockGap styles based on rules contained in layout definitions in theme.json.
		if ( hasBlockGapSupport && hasBlockGapOverride && blockGapValue ) {
			output += getBlockGapCSS(
				selector,
				layoutDefinitions,
				'flex',
				blockGapValue
			);
		}
		return output;
	},
	getOrientation( layout ) {
		const { orientation = 'horizontal' } = layout;
		return orientation;
	},
	getAlignments() {
		return [];
	},
};

function FlexLayoutVerticalAlignmentControl( { layout, onChange } ) {
	const { orientation = 'horizontal' } = layout;

	const defaultVerticalAlignment =
		orientation === 'horizontal'
			? defaultAlignments.horizontal
			: defaultAlignments.vertical;

	const { verticalAlignment = defaultVerticalAlignment } = layout;

	const onVerticalAlignmentChange = ( value ) => {
		onChange( {
			...layout,
			verticalAlignment: value,
		} );
	};

	return (
		<BlockVerticalAlignmentControl
			onChange={ onVerticalAlignmentChange }
			value={ verticalAlignment }
			controls={
				orientation === 'horizontal'
					? [ 'top', 'center', 'bottom', 'stretch' ]
					: [ 'top', 'center', 'bottom', 'space-between' ]
			}
		/>
	);
}

const POPOVER_PROPS = {
	placement: 'bottom-start',
};

function FlexLayoutJustifyContentControl( {
	layout,
	onChange,
	isToolbar = false,
} ) {
	const { justifyContent = 'left', orientation = 'horizontal' } = layout;
	const onJustificationChange = ( value ) => {
		onChange( {
			...layout,
			justifyContent: value,
		} );
	};
	const allowedControls = [ 'left', 'center', 'right' ];
	if ( orientation === 'horizontal' ) {
		allowedControls.push( 'space-between' );
	} else {
		allowedControls.push( 'stretch' );
	}
	if ( isToolbar ) {
		return (
			<JustifyContentControl
				allowedControls={ allowedControls }
				value={ justifyContent }
				onChange={ onJustificationChange }
				popoverProps={ POPOVER_PROPS }
			/>
		);
	}

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
	if ( orientation === 'horizontal' ) {
		justificationOptions.push( {
			value: 'space-between',
			icon: justifySpaceBetween,
			label: __( 'Space between items' ),
		} );
	} else {
		justificationOptions.push( {
			value: 'stretch',
			icon: justifyStretch,
			label: __( 'Stretch items' ),
		} );
	}

	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			label={ __( 'Justification' ) }
			value={ justifyContent }
			onChange={ onJustificationChange }
			className="block-editor-hooks__flex-layout-justification-controls"
		>
			{ justificationOptions.map( ( { value, icon, label } ) => {
				return (
					<ToggleGroupControlOptionIcon
						key={ value }
						value={ value }
						icon={ icon }
						label={ label }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}

function FlexWrapControl( { layout, onChange } ) {
	const { flexWrap = 'wrap' } = layout;
	return (
		<ToggleControl
			label={ __( 'Allow to wrap to multiple lines' ) }
			onChange={ ( value ) => {
				onChange( {
					...layout,
					flexWrap: value ? 'wrap' : 'nowrap',
				} );
			} }
			checked={ flexWrap === 'wrap' }
		/>
	);
}

function OrientationControl( { layout, onChange } ) {
	const {
		orientation = 'horizontal',
		verticalAlignment,
		justifyContent,
	} = layout;
	return (
		<ToggleGroupControl
			__next40pxDefaultSize
			className="block-editor-hooks__flex-layout-orientation-controls"
			label={ __( 'Orientation' ) }
			value={ orientation }
			onChange={ ( value ) => {
				// Make sure the vertical alignment and justification are compatible with the new orientation.
				let newVerticalAlignment = verticalAlignment;
				let newJustification = justifyContent;
				if ( value === 'horizontal' ) {
					if ( verticalAlignment === 'space-between' ) {
						newVerticalAlignment = 'center';
					}
					if ( justifyContent === 'stretch' ) {
						newJustification = 'left';
					}
				} else {
					if ( verticalAlignment === 'stretch' ) {
						newVerticalAlignment = 'top';
					}
					if ( justifyContent === 'space-between' ) {
						newJustification = 'left';
					}
				}
				return onChange( {
					...layout,
					orientation: value,
					verticalAlignment: newVerticalAlignment,
					justifyContent: newJustification,
				} );
			} }
		>
			<ToggleGroupControlOptionIcon
				icon={ arrowRight }
				value="horizontal"
				label={ __( 'Horizontal' ) }
			/>
			<ToggleGroupControlOptionIcon
				icon={ arrowDown }
				value="vertical"
				label={ __( 'Vertical' ) }
			/>
		</ToggleGroupControl>
	);
}
