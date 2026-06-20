/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import { cleanEmptyObject } from './utils';
import { extractPresetSlug } from '../utils/color-values';
import { store as blockEditorStore } from '../store';
import useBlockColorContrastWarning from './contrast-checker';
import {
	default as StylesBackgroundPanel,
	useHasBackgroundPanel,
	hasBackgroundImageValue,
	hasBackgroundGradientValue,
} from '../components/global-styles/background-panel';
import { globalStylesDataKey } from '../store/private-keys';
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';

export const BACKGROUND_SUPPORT_KEY = 'background';

// Initial control values.
export const BACKGROUND_BLOCK_DEFAULT_VALUES = {
	backgroundSize: 'cover',
	backgroundPosition: '50% 50%', // used only when backgroundSize is 'contain'.
};

/**
 * Determine whether there is block support for background.
 *
 * @param {string} blockName Block name.
 * @param {string} feature   Background image feature to check for.
 *
 * @return {boolean} Whether there is support.
 */
export function hasBackgroundSupport( blockName, feature = 'any' ) {
	const support = getBlockSupport( blockName, BACKGROUND_SUPPORT_KEY );

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return (
			!! support?.backgroundImage ||
			!! support?.backgroundSize ||
			!! support?.backgroundRepeat ||
			!! support?.gradient
		);
	}

	return !! support?.[ feature ];
}

export function setBackgroundStyleDefaults( backgroundStyle ) {
	if ( ! backgroundStyle || ! backgroundStyle?.backgroundImage?.url ) {
		return;
	}

	let backgroundStylesWithDefaults;

	// Set block background defaults.
	if ( ! backgroundStyle?.backgroundSize ) {
		backgroundStylesWithDefaults = {
			backgroundSize: BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundSize,
		};
	}

	if (
		'contain' === backgroundStyle?.backgroundSize &&
		! backgroundStyle?.backgroundPosition
	) {
		backgroundStylesWithDefaults = {
			backgroundPosition:
				BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundPosition,
		};
	}
	return backgroundStylesWithDefaults;
}

function useBlockProps( { name, style } ) {
	if (
		! hasBackgroundSupport( name ) ||
		! style?.background?.backgroundImage
	) {
		return;
	}

	const backgroundStyles = setBackgroundStyleDefaults( style?.background );

	if ( ! backgroundStyles ) {
		return;
	}

	return {
		style: {
			...backgroundStyles,
		},
	};
}

/**
 * Generates a CSS class name if an background image is set.
 *
 * @param {Object} style A block's style attribute.
 *
 * @return {string} CSS class name.
 */
export function getBackgroundImageClasses( style ) {
	return hasBackgroundImageValue( style ) ||
		hasBackgroundGradientValue( style )
		? 'has-background'
		: '';
}

// Clears every control the Background panel owns: the background image,
// background color, and the gradient. The Background panel owns the gradient
// control for both the newer `background.gradient` support and the legacy
// `color.gradient` path, so "Reset all" clears the legacy value too,
// regardless of which path stored it.
export function backgroundResetAllFilter( attributes ) {
	const updatedClassName = attributes.className?.includes( 'has-background' )
		? attributes.className
				.split( ' ' )
				.filter( ( c ) => c !== 'has-background' )
				.join( ' ' ) || undefined
		: attributes.className;
	return {
		...attributes,
		className: updatedClassName,
		backgroundColor: undefined,
		gradient: undefined,
		style: cleanEmptyObject( {
			...attributes.style,
			background: undefined,
			color: {
				...attributes.style?.color,
				background: undefined,
				gradient: undefined,
			},
		} ),
	};
}

function BackgroundInspectorControl( { children } ) {
	return (
		<InspectorControls
			group="background"
			resetAllFilter={ backgroundResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

export function BackgroundImagePanel( {
	clientId,
	name,
	setAttributes,
	settings,
	// Allows rendering outside the `background` inspector group (e.g. section
	// blocks direct-render this panel because their support fills are gated
	// off by editing mode). Defaults to the slot-based wrapper.
	asWrapper,
} ) {
	const selectedState = useBlockStyleState();
	const { style, className, backgroundColor, gradient, inheritedValue } =
		useSelect(
			( select ) => {
				const { getBlockAttributes, getSettings } =
					select( blockEditorStore );
				const _settings = getSettings();
				const blockAttributes = getBlockAttributes( clientId );
				return {
					style: blockAttributes?.style,
					className: blockAttributes?.className,
					backgroundColor: blockAttributes?.backgroundColor,
					gradient: blockAttributes?.gradient,
					inheritedValue:
						_settings[ globalStylesDataKey ]?.blocks?.[ name ],
				};
			},
			[ clientId, name ]
		);

	const backgroundGradientSupported = hasBackgroundSupport(
		name,
		'gradient'
	);

	const colorSupport = getBlockSupport( name, 'color' );
	const hasColorBackgroundSupport =
		colorSupport && colorSupport.background !== false;
	const hasColorGradientSupport = !! colorSupport?.gradients;

	const isStateSelected = ! isDefaultBlockStyleState( selectedState );

	// Fold the backgroundColor / gradient attribute slugs back into the style
	// object the panel consumes. When background.gradient is supported but not
	// yet explicitly set, fall back to color.gradient for display.
	const styleValue = {
		...style,
		color: {
			...style?.color,
			background: backgroundColor
				? 'var:preset|color|' + backgroundColor
				: style?.color?.background,
			gradient:
				! backgroundGradientSupported && gradient
					? 'var:preset|gradient|' + gradient
					: style?.color?.gradient,
		},
		...( backgroundGradientSupported && {
			background: {
				...style?.background,
				gradient: gradient
					? 'var:preset|gradient|' + gradient
					: style?.background?.gradient ?? style?.color?.gradient,
			},
		} ),
	};

	// Skipped for gradients, which can't be reliably evaluated for contrast.
	const enableContrastChecking =
		! isStateSelected &&
		! styleValue?.color?.gradient &&
		! styleValue?.background?.gradient &&
		!! styleValue?.color?.background &&
		( settings?.color?.text || settings?.color?.link ) &&
		false !== getBlockSupport( name, [ 'color', 'enableContrastChecker' ] );

	const contrastWarning = useBlockColorContrastWarning( {
		clientId,
		name,
		enabled: !! enableContrastChecking,
		messageOverride: __(
			'This color combination has poor contrast. Consider increasing contrast between background and foreground.'
		),
	} );

	if (
		! useHasBackgroundPanel( settings ) ||
		( ! hasBackgroundSupport( name ) &&
			! hasColorBackgroundSupport &&
			! hasColorGradientSupport )
	) {
		return null;
	}

	const onChange = ( newStyle ) => {
		if ( isStateSelected ) {
			setAttributes( {
				style: setStyleForState( style, selectedState, newStyle ),
			} );
			return;
		}

		// Extract background color slug from style.color.background.
		const newBackgroundColorValue = newStyle?.color?.background;
		const newBackgroundColorSlug = extractPresetSlug(
			newBackgroundColorValue,
			'color'
		);

		// Extract gradient slug — prefer the new background.gradient path
		// when backgroundGradientSupported, fall back to color.gradient.
		const newGradientValue = backgroundGradientSupported
			? newStyle?.background?.gradient
			: newStyle?.color?.gradient;
		const newGradientSlug = extractPresetSlug(
			newGradientValue,
			'gradient'
		);
		const cleanedColorGradient = newGradientSlug
			? undefined
			: newStyle?.color?.gradient;

		// Drop slug-resolved values so they aren't persisted inline alongside
		// the attribute slugs.
		const cleanedStyle = {
			...newStyle,
			color: {
				...newStyle?.color,
				background: newBackgroundColorSlug
					? undefined
					: newBackgroundColorValue,
				gradient: backgroundGradientSupported
					? undefined
					: cleanedColorGradient,
			},
		};
		if ( backgroundGradientSupported ) {
			// Background gradients are kept whole in `style.background.gradient`
			// rather than extracted to the legacy `gradient` attribute.
			cleanedStyle.background = {
				...cleanedStyle.background,
				gradient: newStyle?.background?.gradient,
			};
		}

		const isMigrating =
			backgroundGradientSupported && !! style?.color?.gradient;
		const newAttributes = {
			style: cleanEmptyObject( cleanedStyle ),
			backgroundColor: newBackgroundColorSlug,
			// The legacy `gradient` attribute is only used when the block does
			// not support `background.gradient`; otherwise the gradient is
			// stored in `style.background.gradient` above.
			gradient: backgroundGradientSupported ? undefined : newGradientSlug,
		};

		// When migrating from color.gradient to background.gradient, preserve
		// the has-background class so existing styles relying on it (e.g.
		// theme padding) are not silently broken. Only add the class when a
		// gradient value is being set — not when it is being cleared/reset.
		// Conversely, if the gradient is cleared and has-background was added
		// during a previous migration, remove it so it does not linger.
		const hasNewGradient = !! newGradientSlug || !! newGradientValue;
		if ( isMigrating && hasNewGradient ) {
			newAttributes.className = clsx( className, 'has-background' );
		} else if (
			! hasNewGradient &&
			className?.includes( 'has-background' )
		) {
			newAttributes.className =
				className
					.split( ' ' )
					.filter( ( c ) => c !== 'has-background' )
					.join( ' ' ) || undefined;
		}

		setAttributes( newAttributes );
	};

	const updatedSettings = {
		...settings,
		background: {
			...settings.background,
			backgroundSize:
				settings?.background?.backgroundSize &&
				hasBackgroundSupport( name, 'backgroundSize' ),
		},
	};

	const backgroundDefaultControls = getBlockSupport( name, [
		BACKGROUND_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );
	const colorDefaultControls = getBlockSupport( name, [
		'color',
		'__experimentalDefaultControls',
	] );
	const defaultControls = {
		...backgroundDefaultControls,
		backgroundColor: colorDefaultControls?.background,
		// Mirror the old combined control: show the gradient item by default
		// when background color was shown by default.
		gradient:
			backgroundDefaultControls?.gradient ??
			colorDefaultControls?.background,
	};

	const Wrapper = asWrapper || BackgroundInspectorControl;

	return (
		<StylesBackgroundPanel
			inheritedValue={ inheritedValue }
			as={ Wrapper }
			panelId={ clientId }
			defaultValues={ BACKGROUND_BLOCK_DEFAULT_VALUES }
			settings={ updatedSettings }
			onChange={ onChange }
			defaultControls={ defaultControls }
			value={
				isStateSelected
					? getStyleForState( style, selectedState )
					: styleValue
			}
			contrastWarning={ contrastWarning }
		/>
	);
}

export default {
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport: hasBackgroundSupport,
};
