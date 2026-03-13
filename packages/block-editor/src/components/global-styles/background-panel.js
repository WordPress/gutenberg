/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useCallback, Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getValueFromVariable } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import BackgroundClipControl, {
	ALL_BACKGROUND_CLIP_VALUES,
} from '../background-clip-control';
import BackgroundImageControl from '../background-image-control';
import { ColorPanelDropdown } from './color-panel';
import { useColorsPerOrigin, useGradientsPerOrigin } from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';

const DEFAULT_CONTROLS = {
	backgroundImage: true,
	color: false,
	gradient: false,
};

/**
 * Checks site settings to see if the requested feature's control may be used.
 *
 * @param {Object} settings Site settings.
 * @param {string} feature  Background feature to check.
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundControl(
	settings,
	feature = 'backgroundImage'
) {
	return Platform.OS === 'web' && settings?.background?.[ feature ];
}

/**
 * Checks site settings to see if the background panel may be used.
 * `settings.background.backgroundSize` exists also,
 * but can only be used if settings?.background?.backgroundImage is `true`.
 *
 * @param {Object} settings Site settings
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundPanel( settings ) {
	const {
		backgroundImage,
		color: bgColor,
		gradient,
		backgroundClip,
	} = settings?.background || {};
	return (
		Platform.OS === 'web' &&
		( backgroundImage || bgColor || gradient || backgroundClip )
	);
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
 * Checks if there is a current value in the background color block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background color value set.
 */
export function hasBackgroundColorValue( style ) {
	return (
		'string' === typeof style?.background?.color &&
		style?.background?.color !== ''
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

function BackgroundToolsPanel( {
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
	inheritedValue,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	defaultValues = {},
	headerLabel = __( 'Background' ),
} ) {
	const colors = useColorsPerOrigin( settings );
	const gradients = useGradientsPerOrigin( settings );
	const areCustomSolidsEnabled = settings?.color?.custom;
	const areCustomGradientsEnabled = settings?.color?.customGradient;
	const hasSolidColors = colors.length > 0 || areCustomSolidsEnabled;
	const hasGradientColors = gradients.length > 0 || areCustomGradientsEnabled;

	// Determine whether backgroundClip is currently set to text (text gradient).
	const isTextGradient = value?.background?.backgroundClip === 'text';

	const hasBackgroundColorControl = useHasBackgroundControl(
		settings,
		'color'
	);
	const showBackgroundColorControl =
		hasSolidColors && hasBackgroundColorControl;
	const hasBackgroundGradientControl = useHasBackgroundControl(
		settings,
		'gradient'
	);
	const showBackgroundGradientControl =
		hasGradientColors && hasBackgroundGradientControl;
	const showBackgroundImageControl = useHasBackgroundControl( settings );

	const clipSetting = settings?.background?.backgroundClip;
	let allowedClipValues = [];
	if ( clipSetting === true ) {
		allowedClipValues = ALL_BACKGROUND_CLIP_VALUES;
	} else if ( Array.isArray( clipSetting ) ) {
		allowedClipValues = clipSetting;
	}
	// When text gradient support is active (the color panel's text section
	// handles setting backgroundClip to 'text'), exclude 'text' from the
	// background panel's clip control. This avoids shared-state confusion
	// between the two panels.
	const hasTextGradientSupport =
		allowedClipValues.includes( 'text' ) && hasBackgroundGradientControl;
	if ( hasTextGradientSupport ) {
		allowedClipValues = allowedClipValues.filter( ( v ) => v !== 'text' );
	}
	const showBackgroundClipControl = allowedClipValues.length > 0;

	const resetBackgroundClip = () =>
		onChange(
			setImmutably( value, [ 'background', 'backgroundClip' ], undefined )
		);

	const resetAllFilter = useCallback( ( previousValue ) => {
		const prevClip = previousValue?.background?.backgroundClip;
		const isTextGrad = prevClip === 'text';

		return {
			...previousValue,
			background: {
				// When a text gradient is active, the color panel owns
				// gradient and backgroundClip. Preserve them here so the
				// background panel's "Reset all" only clears background-
				// panel values (image, size, position, etc.).
				...( isTextGrad
					? {
							gradient: previousValue?.background?.gradient,
							backgroundClip: prevClip,
					  }
					: {} ),
			},
		};
	}, [] );

	if (
		! showBackgroundColorControl &&
		! showBackgroundGradientControl &&
		! showBackgroundImageControl &&
		! showBackgroundClipControl
	) {
		return null;
	}

	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
	const encodeColorValue = ( colorValue ) => {
		const allColors = colors.flatMap(
			( { colors: originColors } ) => originColors
		);
		const colorObject = allColors.find(
			( { color } ) => color === colorValue
		);
		return colorObject
			? 'var:preset|color|' + colorObject.slug
			: colorValue;
	};
	const encodeGradientValue = ( gradientValue ) => {
		const allGradients = gradients.flatMap(
			( { gradients: originGradients } ) => originGradients
		);
		const gradientObject = allGradients.find(
			( { gradient } ) => gradient === gradientValue
		);
		return gradientObject
			? 'var:preset|gradient|' + gradientObject.slug
			: gradientValue;
	};

	const resetBackgroundImage = () =>
		onChange(
			setImmutably(
				value,
				[ 'background', 'backgroundImage' ],
				undefined
			)
		);

	// Background color logic.
	const currentColor = decodeValue( value?.background?.color );
	const inheritedColor = decodeValue( inheritedValue?.background?.color );

	const setBackgroundColor = ( newColor ) => {
		onChange(
			setImmutably(
				value,
				[ 'background', 'color' ],
				encodeColorValue( newColor )
			)
		);
	};

	const resetBackgroundColor = () => {
		onChange( setImmutably( value, [ 'background', 'color' ], undefined ) );
	};

	const resetGradient = () => {
		let newValue = setImmutably(
			value,
			[ 'background', 'gradient' ],
			undefined
		);
		// If the gradient was used as a text gradient, also clear backgroundClip
		// to avoid leaving text invisible with no gradient applied.
		if ( value?.background?.backgroundClip === 'text' ) {
			newValue = setImmutably(
				newValue,
				[ 'background', 'backgroundClip' ],
				undefined
			);
		}
		onChange( newValue );
	};

	// Get current gradient value, decoding preset slug references.
	const currentGradient = decodeValue( value?.background?.gradient );
	const inheritedGradient = decodeValue(
		inheritedValue?.background?.gradient
	);

	// Set gradient value, encoding preset matches as slug references.
	const setGradient = ( newGradient ) => {
		onChange(
			setImmutably(
				value,
				[ 'background', 'gradient' ],
				encodeGradientValue( newGradient )
			)
		);
	};

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
			headerLabel={ headerLabel }
		>
			{ showBackgroundImageControl && (
				<ToolsPanelItem
					className="block-editor-background-panel__item"
					hasValue={ () => hasBackgroundImageValue( value ) }
					label={ __( 'Image' ) }
					onDeselect={ resetBackgroundImage }
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
					/>
				</ToolsPanelItem>
			) }
			{ showBackgroundColorControl && (
				<ColorPanelDropdown
					className="block-editor-background-panel__item"
					label={ __( 'Color' ) }
					hasValue={ () => hasBackgroundColorValue( value ) }
					resetValue={ resetBackgroundColor }
					isShownByDefault={ defaultControls.color }
					indicators={ [ currentColor ] }
					tabs={ [
						{
							key: 'color',
							label: __( 'Color' ),
							inheritedValue: currentColor ?? inheritedColor,
							setValue: setBackgroundColor,
							userValue: currentColor,
						},
					] }
					colorGradientControlSettings={ {
						colors,
						disableCustomColors: ! areCustomSolidsEnabled,
						gradients,
						disableCustomGradients: ! areCustomGradientsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
			{ showBackgroundGradientControl && (
				<ColorPanelDropdown
					className="block-editor-background-panel__item"
					label={ __( 'Gradient' ) }
					hasValue={ () =>
						hasBackgroundGradientValue( value ) && ! isTextGradient
					}
					resetValue={ resetGradient }
					isShownByDefault={ defaultControls.gradient }
					indicators={ [ currentGradient ] }
					tabs={ [
						{
							key: 'gradient',
							label: __( 'Gradient' ),
							inheritedValue:
								currentGradient ?? inheritedGradient,
							setValue: setGradient,
							userValue: currentGradient,
							isGradient: true,
						},
					] }
					colorGradientControlSettings={ {
						colors,
						disableCustomColors: ! areCustomSolidsEnabled,
						gradients,
						disableCustomGradients: ! areCustomGradientsEnabled,
					} }
					panelId={ panelId }
				/>
			) }
			{ showBackgroundClipControl && (
				<ToolsPanelItem
					className="block-editor-background-panel__item"
					hasValue={ () =>
						!! value?.background?.backgroundClip &&
						value?.background?.backgroundClip !== 'text'
					}
					label={ __( 'Clip' ) }
					onDeselect={ resetBackgroundClip }
					isShownByDefault={ defaultControls.backgroundClip }
					panelId={ panelId }
				>
					<BackgroundClipControl
						value={ value?.background?.backgroundClip }
						onChange={ ( newClip ) => {
							onChange(
								setImmutably(
									value,
									[ 'background', 'backgroundClip' ],
									newClip
								)
							);
						} }
						allowedValues={ allowedClipValues }
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
