import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import BackgroundClipControl, {
	ALL_BACKGROUND_CLIP_VALUES,
} from '../background-clip-control';
import BackgroundImageControl from '../background-image-control';
import ColorGradientDropdownItem from './color-gradient-dropdown-item';
import { useHasBackgroundColorPanel } from './color-panel';
import { useColorGradientSettings } from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';
import {
	extractPresetSlug,
	encodeColorValueWithPalette,
} from '../../utils/color-values';
import {
	getInheritanceProps,
	InheritanceToolsPanelItem,
	isGlobalStylesInheritanceEnabled,
} from './inheritance';

const DEFAULT_CONTROLS = {
	backgroundImage: true,
	backgroundColor: true,
	gradient: true,
	backgroundClip: false,
};

/**
 * Checks site settings to see if the requested feature's control may be used.
 *
 * @param {Object} settings Site settings.
 * @param {string} feature  Background feature to check.
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundControl( settings, feature ) {
	return settings?.background?.[ feature ];
}

/**
 * Checks site settings to see if the background panel may be used.
 * `settings.background.backgroundSize` exists also,
 * but can only be used if settings?.background?.backgroundImage is `true`.
 *
 * The panel is also shown when the block has color panel background
 * support (`settings.color.background`), because background color and
 * the legacy `color.gradient` control are rendered here.
 *
 * @param {Object} settings Site settings
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundPanel( settings ) {
	const hasBackgroundColor = useHasBackgroundColorPanel( settings );
	const { backgroundImage, gradient, backgroundClip } =
		settings?.background || {};
	return backgroundImage || gradient || backgroundClip || hasBackgroundColor;
}

/**
 * Checks if there is a current value in the background size block support
 * attributes. Background size values include background size as well
 * as background position.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background size value set.
 */
export function hasBackgroundSizeValue( style ) {
	return (
		style?.background?.backgroundPosition !== undefined ||
		style?.background?.backgroundSize !== undefined
	);
}

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background image value set.
 */
export function hasBackgroundImageValue( style ) {
	return (
		!! style?.background?.backgroundImage?.id ||
		// Supports url() string values in theme.json.
		'string' === typeof style?.background?.backgroundImage ||
		!! style?.background?.backgroundImage?.url
	);
}

/**
 * Checks if there is a current value in the background gradient block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background gradient value set.
 */
export function hasBackgroundGradientValue( style ) {
	return (
		'string' === typeof style?.background?.gradient &&
		style?.background?.gradient !== ''
	);
}

/**
 * Checks if there is a current value for the background color (written to
 * `color.background`).
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background color value set.
 */
export function hasBackgroundColorValue( style ) {
	return !! style?.color?.background;
}

/**
 * Checks if there is a current value in the legacy `color.gradient` location
 * (used by blocks with color panel gradient support that haven't adopted the
 * `background.gradient` block support).
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a legacy color gradient value set.
 */
export function hasLegacyColorGradientValue( style ) {
	return !! style?.color?.gradient;
}

export function BackgroundToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
	headerLabel,
} ) {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ headerLabel }
			resetAll={ resetAll }
			panelId={ panelId }
			hasInnerWrapper
			className="background-block-support-panel"
			__experimentalFirstVisibleItemClass="first"
			__experimentalLastVisibleItemClass="last"
			dropdownMenuProps={ dropdownMenuProps }
		>
			<div className="background-block-support-panel__inner-wrapper">
				{ children }
			</div>
		</ToolsPanel>
	);
}

export default function BackgroundImagePanel( {
	as: Wrapper = BackgroundToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	defaultValues = {},
	headerLabel = __( 'Background' ),
	contrastWarning,
	showInheritanceLabelIndicators = isGlobalStylesInheritanceEnabled(),
} ) {
	const {
		colors,
		gradients,
		allColors,
		areCustomSolidsEnabled,
		areCustomGradientsEnabled,
		hasSolidColors,
		hasGradientColors,
		decodeValue,
		encodeGradientValue,
	} = useColorGradientSettings( settings );

	const hasBackgroundGradientControl = useHasBackgroundControl(
		settings,
		'gradient'
	);
	const hasColorPanelBackgroundSupport =
		useHasBackgroundColorPanel( settings );
	const showBackgroundColorControl =
		hasColorPanelBackgroundSupport && hasSolidColors;
	// New `background.gradient` block support — gradient lives under the
	// `background` style path.
	const showBackgroundGradientControl =
		hasGradientColors && hasBackgroundGradientControl;
	// Legacy `color.gradient` path — only rendered when the block has
	// color panel background support and hasn't adopted the newer
	// `background.gradient` support. Keeps the UI consistent for blocks
	// that still write gradients to `color.gradient`.
	const showLegacyColorGradientControl =
		hasColorPanelBackgroundSupport &&
		hasGradientColors &&
		! hasBackgroundGradientControl;
	const showBackgroundImageControl = useHasBackgroundControl(
		settings,
		'backgroundImage'
	);

	// The clip control is only exposed when a theme opts in, either with
	// `true` for every value or an array naming the ones it wants.
	const clipSetting = settings?.background?.backgroundClip;
	let allowedClipValues = [];
	if ( true === clipSetting ) {
		allowedClipValues = ALL_BACKGROUND_CLIP_VALUES;
	} else if ( Array.isArray( clipSetting ) ) {
		allowedClipValues = clipSetting;
	}
	const showBackgroundClipControl = allowedClipValues.length > 0;

	const localClip = value?.background?.backgroundClip;
	const inheritedClip = inheritedValue?.background?.backgroundClip;
	// A gradient clipped to text is a text gradient, which the Typography
	// panel owns. This panel only treats it as its own when the clip control
	// has been opted into.
	const isTextGradient = localClip === 'text';
	// Without the clip control this panel cannot build a text gradient, so it
	// shows no value for one and turns its gradient control off. With the clip
	// control that gradient is set here, so the control has to stay usable.
	const deferTextGradient = ! showBackgroundClipControl;
	// `background-clip` clips every background layer at once, so an element
	// paints a background gradient or a text gradient, never both.
	const clipsToText = ( localClip ?? inheritedClip ) === 'text';

	const resetAllFilter = useCallback(
		( previousValue ) => {
			const clearsColorBackground = showBackgroundColorControl;
			const clearsColorGradient =
				hasBackgroundGradientControl || showLegacyColorGradientControl;
			// Without the clip control, a text gradient belongs to the
			// Typography panel and must survive a reset here.
			const prevClip = previousValue?.background?.backgroundClip;
			const background =
				! showBackgroundClipControl && 'text' === prevClip
					? {
							gradient: previousValue?.background?.gradient,
							backgroundClip: prevClip,
					  }
					: {};
			if ( ! clearsColorBackground && ! clearsColorGradient ) {
				return { ...previousValue, background };
			}
			return {
				...previousValue,
				background,
				color: {
					...previousValue?.color,
					...( clearsColorBackground && { background: undefined } ),
					...( clearsColorGradient && { gradient: undefined } ),
				},
			};
		},
		[
			hasBackgroundGradientControl,
			showBackgroundColorControl,
			showLegacyColorGradientControl,
			showBackgroundClipControl,
		]
	);

	if (
		! showBackgroundImageControl &&
		! showBackgroundColorControl &&
		! showBackgroundGradientControl &&
		! showLegacyColorGradientControl &&
		! showBackgroundClipControl
	) {
		return null;
	}

	const resetBackground = () =>
		onChange(
			setImmutably(
				value,
				[ 'background', 'backgroundImage' ],
				undefined
			)
		);

	const resetGradient = () => {
		let newValue = setImmutably(
			value,
			[ 'background', 'gradient' ],
			undefined
		);
		newValue = setImmutably( newValue, [ 'color', 'gradient' ], undefined );
		// Clearing the gradient behind a text clip would leave the text
		// invisible, so drop the clip with it.
		if ( isTextGradient ) {
			newValue = setImmutably(
				newValue,
				[ 'background', 'backgroundClip' ],
				undefined
			);
		}
		onChange( newValue );
	};

	const resetBackgroundClip = () =>
		onChange(
			setImmutably( value, [ 'background', 'backgroundClip' ], undefined )
		);

	// Non-cascading root values are already dropped from `inheritedValue` by
	// the builder, so inherited reads below are direct.

	// Background color (written to `color.background`).
	const backgroundColor = decodeValue( inheritedValue?.color?.background );
	const userBackgroundColor = decodeValue( value?.color?.background );
	const setBackgroundColor = ( newColor, newSlug ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			encodeColorValueWithPalette( allColors, newColor, newSlug )
		);
		// Legacy `color.gradient` is mutually exclusive with
		// `color.background`. `background.gradient` is independent and
		// should not be touched.
		if ( showLegacyColorGradientControl ) {
			newValue.color.gradient = undefined;
		}
		onChange( newValue );
	};
	const resetBackgroundColor = () => {
		const newValue = setImmutably(
			value,
			[ 'color', 'background' ],
			undefined
		);
		if ( showLegacyColorGradientControl ) {
			newValue.color.gradient = undefined;
		}
		onChange( newValue );
	};

	// Legacy `color.gradient` setters.
	const legacyColorGradient = decodeValue( inheritedValue?.color?.gradient );
	const userLegacyColorGradient = decodeValue( value?.color?.gradient );
	const setLegacyColorGradient = ( newGradient, newSlug ) => {
		const newValue = setImmutably(
			value,
			[ 'color', 'gradient' ],
			encodeGradientValue( newGradient, newSlug )
		);
		newValue.color.background = undefined;
		onChange( newValue );
	};
	const resetLegacyColorGradient = () =>
		onChange( setImmutably( value, [ 'color', 'gradient' ], undefined ) );

	// Get current gradient value, decoding preset slug references.
	// Fall back to color.gradient for legacy blocks that haven't migrated
	// to background.gradient yet (mirrors block inspector fallback in
	// packages/block-editor/src/hooks/background.jsx).
	// A deferred text gradient is left out so it does not appear to be this
	// panel's gradient.
	const currentGradient =
		deferTextGradient && isTextGradient
			? undefined
			: decodeValue(
					value?.background?.gradient ?? value?.color?.gradient
			  );
	const inheritedGradient =
		deferTextGradient && inheritedClip === 'text'
			? undefined
			: decodeValue(
					inheritedValue?.background?.gradient ??
						inheritedValue?.color?.gradient
			  );

	// Set gradient value, encoding preset matches as slug references.
	// Also clear color.gradient to migrate from the legacy location,
	// matching the block inspector behavior in hooks/background.jsx.
	const setGradient = ( newGradient, newSlug ) => {
		let newValue = setImmutably(
			value,
			[ 'background', 'gradient' ],
			encodeGradientValue( newGradient, newSlug )
		);
		newValue = setImmutably( newValue, [ 'color', 'gradient' ], undefined );
		onChange( newValue );
	};

	const inheritanceProps = ( isInherited, hasLocalOverride, classNames ) =>
		showInheritanceLabelIndicators
			? getInheritanceProps( isInherited, hasLocalOverride, classNames )
			: { className: classNames };

	// The inherited value arrives already resolved (refs + theme-file pointers)
	// with non-cascading root values dropped, so a presence check drives the
	// label affordance and matches what `BackgroundImageControl` renders.
	const inheritedBackgroundImage = hasBackgroundImageValue( {
		background: {
			backgroundImage: inheritedValue?.background?.backgroundImage,
		},
	} );
	const hasLocalBackgroundImage = hasBackgroundImageValue( value );

	const inheritedBackgroundClip = inheritedValue?.background?.backgroundClip;
	const hasLocalBackgroundClip =
		value?.background?.backgroundClip !== undefined;

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			headerLabel={ headerLabel }
		>
			{ showBackgroundImageControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						inheritedBackgroundImage && ! hasLocalBackgroundImage,
						hasLocalBackgroundImage && inheritedBackgroundImage,
						'block-editor-color-gradient-item'
					) }
					showLocalOverrideActionsInLabel={ false }
					hasValue={ () => hasBackgroundImageValue( value ) }
					label={ __( 'Image' ) }
					onDeselect={ resetBackground }
					isShownByDefault={ defaultControls.backgroundImage }
					panelId={ panelId }
				>
					<BackgroundImageControl
						value={ value }
						onChange={ onChange }
						settings={ settings }
						inheritedValue={ inheritedValue }
						defaultControls={ defaultControls }
						defaultValues={ defaultValues }
						showInheritanceLabelIndicators={
							showInheritanceLabelIndicators
						}
					/>
				</InheritanceToolsPanelItem>
			) }
			{ showBackgroundColorControl && (
				<ColorGradientDropdownItem
					label={ __( 'Color' ) }
					hasValue={ () => hasBackgroundColorValue( value ) }
					resetValue={ resetBackgroundColor }
					isShownByDefault={ defaultControls.backgroundColor }
					indicators={ [ userBackgroundColor ?? backgroundColor ] }
					contrastWarning={ contrastWarning }
					showInheritanceLabelIndicators={
						showInheritanceLabelIndicators
					}
					isPlaceholder={
						userBackgroundColor === undefined &&
						backgroundColor !== undefined
					}
					hasInheritedValue={ backgroundColor !== undefined }
					tabs={ [
						{
							key: 'background',
							label: __( 'Color' ),
							inheritedValue: backgroundColor,
							// The picker selects by slug: `userSlug` when the
							// block has its own value, otherwise
							// `inheritedSlug`. Hex matching would mark two
							// same-hex presets as both selected.
							inheritedSlug: extractPresetSlug(
								inheritedValue?.color?.background,
								'color'
							),
							userSlug: extractPresetSlug(
								value?.color?.background,
								'color'
							),
							setValue: setBackgroundColor,
							userValue: userBackgroundColor,
							isPlaceholder:
								userBackgroundColor === undefined &&
								backgroundColor !== undefined,
						},
					] }
					colorGradientControlSettings={ {
						colors,
						disableCustomColors: ! areCustomSolidsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
			{ showBackgroundGradientControl && (
				<ColorGradientDropdownItem
					label={ __( 'Gradient' ) }
					hasValue={ () =>
						hasBackgroundGradientValue( value ) && ! isTextGradient
					}
					resetValue={ resetGradient }
					disabled={ deferTextGradient && clipsToText }
					disabledHint={ __(
						'The text gradient is set in the Typography panel.'
					) }
					isShownByDefault={ defaultControls.gradient }
					indicators={ [ currentGradient ?? inheritedGradient ] }
					showInheritanceLabelIndicators={
						showInheritanceLabelIndicators
					}
					isPlaceholder={
						currentGradient === undefined &&
						inheritedGradient !== undefined
					}
					hasInheritedValue={ inheritedGradient !== undefined }
					tabs={ [
						{
							key: 'gradient',
							label: __( 'Gradient' ),
							inheritedValue: inheritedGradient,
							inheritedSlug: extractPresetSlug(
								inheritedValue?.background?.gradient ??
									inheritedValue?.color?.gradient,
								'gradient'
							),
							userSlug: extractPresetSlug(
								value?.background?.gradient ??
									value?.color?.gradient,
								'gradient'
							),
							setValue: setGradient,
							userValue: currentGradient,
							isGradient: true,
							isPlaceholder:
								currentGradient === undefined &&
								inheritedGradient !== undefined,
						},
					] }
					colorGradientControlSettings={ {
						gradients,
						disableCustomGradients: ! areCustomGradientsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
			{ showLegacyColorGradientControl && (
				<ColorGradientDropdownItem
					label={ __( 'Gradient' ) }
					hasValue={ () => hasLegacyColorGradientValue( value ) }
					resetValue={ resetLegacyColorGradient }
					isShownByDefault={ defaultControls.gradient }
					indicators={ [
						userLegacyColorGradient ?? legacyColorGradient,
					] }
					showInheritanceLabelIndicators={
						showInheritanceLabelIndicators
					}
					isPlaceholder={
						userLegacyColorGradient === undefined &&
						legacyColorGradient !== undefined
					}
					hasInheritedValue={ legacyColorGradient !== undefined }
					tabs={ [
						{
							key: 'gradient',
							label: __( 'Gradient' ),
							inheritedValue: legacyColorGradient,
							inheritedSlug: extractPresetSlug(
								inheritedValue?.color?.gradient,
								'gradient'
							),
							userSlug: extractPresetSlug(
								value?.color?.gradient,
								'gradient'
							),
							setValue: setLegacyColorGradient,
							userValue: userLegacyColorGradient,
							isGradient: true,
							isPlaceholder:
								userLegacyColorGradient === undefined &&
								legacyColorGradient !== undefined,
						},
					] }
					colorGradientControlSettings={ {
						gradients,
						disableCustomGradients: ! areCustomGradientsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
			{ showBackgroundClipControl && (
				<InheritanceToolsPanelItem
					{ ...inheritanceProps(
						inheritedBackgroundClip && ! hasLocalBackgroundClip,
						hasLocalBackgroundClip &&
							inheritedBackgroundClip !== undefined,
						'block-editor-background-panel__clip-item'
					) }
					label={ __( 'Clip' ) }
					// A text clip belongs to the Typography panel's gradient
					// control, so it does not count as a value here. Without
					// this the control would appear in this panel as a side
					// effect of setting a text gradient elsewhere.
					hasValue={ () =>
						hasLocalBackgroundClip && ! isTextGradient
					}
					onDeselect={ resetBackgroundClip }
					isShownByDefault={ defaultControls.backgroundClip }
					panelId={ panelId }
				>
					<BackgroundClipControl
						value={
							value?.background?.backgroundClip ??
							inheritedBackgroundClip
						}
						onChange={ ( newClip ) =>
							onChange(
								setImmutably(
									value,
									[ 'background', 'backgroundClip' ],
									newClip
								)
							)
						}
						allowedValues={ allowedClipValues }
					/>
				</InheritanceToolsPanelItem>
			) }
		</Wrapper>
	);
}
