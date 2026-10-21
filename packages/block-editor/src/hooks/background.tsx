import clsx from 'clsx';
import { getBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
	useBlockStyleState,
} from './block-style-state';
import { useResolvedStyle } from '../components/global-styles/inherited-value-context';
import type {
	PanelBackgroundStyle,
	PanelResetAllFilter,
	PanelStyle,
} from '../components/global-styles/types';
import type {
	BackgroundAttributes,
	BackgroundHookPanelProps,
	ResetAllFilter,
	StyleInspectorControlProps,
} from './types';

export const BACKGROUND_SUPPORT_KEY = 'background';

// Initial control values.
export const BACKGROUND_BLOCK_DEFAULT_VALUES = {
	backgroundSize: 'cover',
	backgroundPosition: '50% 50%', // used only when backgroundSize is 'contain'.
};

/**
 * Determine whether there is block support for background.
 *
 * @param blockName Block name.
 * @param feature   Background image feature to check for.
 *
 * @return Whether there is support.
 */
export function hasBackgroundSupport(
	blockName: string | BlockType,
	feature: string = 'any'
): boolean {
	// The support is `true` or flags each background feature.
	const support = getBlockSupport( blockName, BACKGROUND_SUPPORT_KEY ) as
		true | Record< string, unknown > | undefined;

	if ( support === true ) {
		return true;
	}

	if ( feature === 'any' ) {
		return (
			!! support?.backgroundImage ||
			!! support?.backgroundSize ||
			!! support?.backgroundRepeat ||
			!! support?.gradient ||
			!! support?.backgroundClip
		);
	}

	return !! support?.[ feature ];
}

export function setBackgroundStyleDefaults(
	backgroundStyle: PanelBackgroundStyle | undefined
) {
	if (
		! backgroundStyle ||
		// The string form has no URL property.
		! ( backgroundStyle?.backgroundImage as { url?: string } | undefined )
			?.url
	) {
		return;
	}

	let backgroundStylesWithDefaults:
		{ backgroundSize?: string; backgroundPosition?: string } | undefined;

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

function useBlockProps( {
	name,
	style,
}: {
	name: string;
	style?: PanelStyle;
} ) {
	if (
		! hasBackgroundSupport( name ) ||
		! style?.background?.backgroundImage
	) {
		return;
	}

	// An opted-in block applies the background, defaults included, itself.
	const skipSerialization = getBlockSupport( name, [
		BACKGROUND_SUPPORT_KEY,
		'__experimentalSkipSerialization',
	] ) as unknown;
	if (
		skipSerialization === true ||
		( Array.isArray( skipSerialization ) &&
			skipSerialization.includes( 'backgroundImage' ) )
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
 * @param style A block's style attribute.
 *
 * @return CSS class name.
 */
export function getBackgroundImageClasses( style: PanelStyle | undefined ) {
	const hasBackground =
		hasBackgroundImageValue( style ) || hasBackgroundGradientValue( style );

	// A text clip paints the glyphs, not the block. Mirror of
	// `gutenberg_get_background_classes_and_styles()`.
	if ( ! hasBackground || 'text' === style?.background?.backgroundClip ) {
		return '';
	}

	return 'has-background';
}

// Clears every control the Background panel owns: the background image,
// background color, and the gradient. The Background panel owns the gradient
// control for both the newer `background.gradient` support and the legacy
// `color.gradient` path, so "Reset all" clears the legacy value too,
// regardless of which path stored it. `panelResetAllFilter` keeps what the
// panel does not own, like a text gradient.
export function backgroundResetAllFilter(
	attributes: BackgroundAttributes,
	panelResetAllFilter?: PanelResetAllFilter
): BackgroundAttributes {
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
		// Cleaning leaves out only the empty values.
		style: cleanEmptyObject( {
			...attributes.style,
			background: panelResetAllFilter?.( attributes.style )?.background,
			color: {
				...attributes.style?.color,
				background: undefined,
				gradient: undefined,
			},
		} ) as PanelStyle | undefined,
	};
}

function BackgroundInspectorControl( {
	children,
	resetAllFilter,
}: StyleInspectorControlProps ) {
	const attributesResetAllFilter = useCallback(
		( attributes: BackgroundAttributes ) =>
			backgroundResetAllFilter( attributes, resetAllFilter ),
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="background"
			// The filter reads the background attributes.
			resetAllFilter={ attributesResetAllFilter as ResetAllFilter }
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
}: BackgroundHookPanelProps ) {
	const selectedState = useBlockStyleState();
	const {
		style,
		className,
		backgroundColor,
		gradient,
	}: BackgroundAttributes = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			// The block's attributes hold its background styles.
			const blockAttributes = getBlockAttributes(
				clientId
			) as BackgroundAttributes | null;
			return {
				style: blockAttributes?.style,
				className: blockAttributes?.className,
				backgroundColor: blockAttributes?.backgroundColor,
				gradient: blockAttributes?.gradient,
			};
		},
		[ clientId ]
	);

	const { value: inheritedValue } = useResolvedStyle(
		name,
		className,
		selectedState
	);

	const backgroundGradientSupported =
		hasBackgroundSupport( name, 'gradient' ) &&
		!! settings?.background?.gradient;

	// The color support flags each color feature.
	const colorSupport = getBlockSupport( name, 'color' ) as
		{ background?: boolean; gradients?: boolean } | undefined;
	const hasColorBackgroundSupport =
		colorSupport && colorSupport.background !== false;
	const hasColorGradientSupport = !! colorSupport?.gradients;

	const isStateSelected = ! isDefaultBlockStyleState( selectedState );

	// Fold the backgroundColor / gradient attribute slugs back into the style
	// object the panel consumes. When background.gradient is supported but not
	// yet explicitly set, fall back to color.gradient for display.
	const styleValue: PanelStyle = {
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
					: ( style?.background?.gradient ?? style?.color?.gradient ),
			},
		} ),
	};
	const value = isStateSelected
		? // The state styles have the shape of the block styles.
			( getStyleForState( style, selectedState ) as
				PanelStyle | undefined )
		: styleValue;

	// Skipped for gradients, which can't be reliably evaluated for contrast.
	const enableContrastChecking =
		! value?.color?.gradient &&
		! value?.background?.gradient &&
		!! value?.color?.background &&
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

	const onChange = ( newStyle: PanelStyle ) => {
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
		const cleanedStyle: PanelStyle = {
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
		const newAttributes: BackgroundAttributes = {
			// Cleaning leaves out only the empty values.
			style: cleanEmptyObject( cleanedStyle ) as PanelStyle | undefined,
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
		const isTextGradient = 'text' === newStyle?.background?.backgroundClip;
		if ( isMigrating && hasNewGradient && ! isTextGradient ) {
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

	// The default controls map control names to whether they show.
	const backgroundDefaultControls = getBlockSupport( name, [
		BACKGROUND_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] ) as Record< string, boolean > | undefined;
	const colorDefaultControls = getBlockSupport( name, [
		'color',
		'__experimentalDefaultControls',
	] ) as Record< string, boolean > | undefined;
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
			as={ Wrapper }
			panelId={ clientId }
			defaultValues={ BACKGROUND_BLOCK_DEFAULT_VALUES }
			settings={ updatedSettings }
			onChange={ onChange }
			defaultControls={ defaultControls }
			value={
				isStateSelected
					? // The state styles have the shape of the block styles.
						( getStyleForState( style, selectedState ) as
							PanelStyle | undefined )
					: styleValue
			}
			baseValue={ isStateSelected ? styleValue : undefined }
			contrastWarning={ contrastWarning }
			inheritedValue={ inheritedValue }
		/>
	);
}

export default {
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport: hasBackgroundSupport,
};
