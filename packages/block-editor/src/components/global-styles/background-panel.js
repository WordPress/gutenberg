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
import { useGradientsPerOrigin } from './hooks';
import { useToolsPanelDropdownMenuProps } from './utils';
import { setImmutably } from '../../utils/object';

const DEFAULT_CONTROLS = {
	backgroundImage: true,
	gradient: false,
};

/**
 * Checks site settings to see if the requested feature's control may be used.
 *
 * @param {Object} settings Site settings.
 * @param {string} feature  Background feature to check.
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundControl( settings, feature ) {
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
	const { backgroundImage, gradient, backgroundClip } =
		settings?.background || {};
	return (
		Platform.OS === 'web' &&
		( backgroundImage || gradient || backgroundClip )
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
	const gradients = useGradientsPerOrigin( settings );
	const areCustomGradientsEnabled = settings?.color?.customGradient;
	const hasGradientColors = gradients.length > 0 || areCustomGradientsEnabled;

	// Determine whether backgroundClip is currently set to text (text gradient).
	const isTextGradient = value?.background?.backgroundClip === 'text';

	const hasBackgroundGradientControl = useHasBackgroundControl(
		settings,
		'gradient'
	);
	const showBackgroundGradientControl =
		hasGradientColors && hasBackgroundGradientControl;
	const showBackgroundImageControl = useHasBackgroundControl(
		settings,
		'backgroundImage'
	);

	const clipSetting = settings?.background?.backgroundClip;
	let allowedClipValues = [];
	if ( clipSetting === true ) {
		allowedClipValues = ALL_BACKGROUND_CLIP_VALUES;
	} else if ( Array.isArray( clipSetting ) ) {
		allowedClipValues = clipSetting;
	}
	const showBackgroundClipControl = allowedClipValues.length > 0;

	const resetBackgroundClip = () =>
		onChange(
			setImmutably( value, [ 'background', 'backgroundClip' ], undefined )
		);

	const resetAllFilter = useCallback(
		( previousValue ) => {
			const prevClip = previousValue?.background?.backgroundClip;
			// When the background clip UI has not been explicitly opted into
			// via theme.json settings, backgroundClip (and its companion
			// gradient) is owned by the color panel's text gradient handling
			// and must be preserved here.
			const preserveTextGradient =
				! showBackgroundClipControl && prevClip === 'text';

			return {
				...previousValue,
				background: {
					...( preserveTextGradient
						? {
								gradient: previousValue?.background?.gradient,
								backgroundClip: prevClip,
						  }
						: {} ),
				},
				color: hasBackgroundGradientControl
					? {
							...previousValue?.color,
							gradient: undefined,
					  }
					: previousValue?.color,
			};
		},
		[ hasBackgroundGradientControl, showBackgroundClipControl ]
	);

	if (
		! showBackgroundGradientControl &&
		! showBackgroundImageControl &&
		! showBackgroundClipControl
	) {
		return null;
	}

	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );
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

	const resetGradient = () => {
		let newValue = setImmutably(
			value,
			[ 'background', 'gradient' ],
			undefined
		);
		newValue = setImmutably( newValue, [ 'color', 'gradient' ], undefined );
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
	// Fall back to color.gradient for legacy blocks that haven't migrated
	// to background.gradient yet (mirrors block inspector fallback in
	// packages/block-editor/src/hooks/background.js).
	const currentGradient = decodeValue(
		value?.background?.gradient ?? value?.color?.gradient
	);
	const inheritedGradient = decodeValue(
		inheritedValue?.background?.gradient ?? inheritedValue?.color?.gradient
	);

	// Set gradient value, encoding preset matches as slug references.
	// Also clear color.gradient to migrate from the legacy location,
	// matching the block inspector behavior in hooks/background.js.
	const setGradient = ( newGradient ) => {
		let newValue = setImmutably(
			value,
			[ 'background', 'gradient' ],
			encodeGradientValue( newGradient )
		);
		newValue = setImmutably( newValue, [ 'color', 'gradient' ], undefined );
		onChange( newValue );
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
