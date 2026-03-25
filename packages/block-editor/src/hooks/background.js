/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import { cleanEmptyObject } from './utils';
import { store as blockEditorStore } from '../store';
import {
	default as StylesBackgroundPanel,
	useHasBackgroundPanel,
	hasBackgroundImageValue,
	hasBackgroundGradientValue,
} from '../components/global-styles/background-panel';
import { globalStylesDataKey } from '../store/private-keys';

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

function BackgroundInspectorControl( {
	children,
	backgroundGradientSupported = false,
} ) {
	const resetAllFilter = useCallback(
		( attributes ) => {
			const updatedClassName = attributes.className?.includes(
				'has-background'
			)
				? attributes.className
						.split( ' ' )
						.filter( ( c ) => c !== 'has-background' )
						.join( ' ' ) || undefined
				: attributes.className;
			return {
				...attributes,
				className: updatedClassName,
				style: cleanEmptyObject( {
					...attributes.style,
					background: undefined,
					color: backgroundGradientSupported
						? {
								...attributes.style?.color,
								gradient: undefined,
						  }
						: attributes.style?.color,
				} ),
			};
		},
		[ backgroundGradientSupported ]
	);
	return (
		<InspectorControls group="background" resetAllFilter={ resetAllFilter }>
			{ children }
		</InspectorControls>
	);
}

export function BackgroundImagePanel( {
	clientId,
	name,
	setAttributes,
	settings,
} ) {
	const { style, className, inheritedValue } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } =
				select( blockEditorStore );
			const _settings = getSettings();
			const blockAttributes = getBlockAttributes( clientId );
			return {
				style: blockAttributes?.style,
				className: blockAttributes?.className,
				/*
				 * To ensure we pass down the right inherited values:
				 * @TODO 1. Pass inherited value down to all block style controls,
				 *   See: packages/block-editor/src/hooks/style.js
				 * @TODO 2. Add support for block style variations,
				 *   See implementation: packages/block-editor/src/hooks/block-style-variation.js
				 */
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

	// Must be declared before the early return to follow Rules of Hooks.
	// Passes backgroundGradientSupported so that "Reset All" also clears
	// the legacy color.gradient value when background.gradient is supported.
	const as = useCallback(
		( { children } ) => (
			<BackgroundInspectorControl
				backgroundGradientSupported={ backgroundGradientSupported }
			>
				{ children }
			</BackgroundInspectorControl>
		),
		[ backgroundGradientSupported ]
	);

	if (
		! useHasBackgroundPanel( settings ) ||
		! hasBackgroundSupport( name )
	) {
		return null;
	}

	const onChange = ( newStyle ) => {
		const isMigrating =
			backgroundGradientSupported && !! style?.color?.gradient;
		const newAttributes = {
			style: cleanEmptyObject(
				backgroundGradientSupported
					? {
							...newStyle,
							color: {
								...newStyle?.color,
								gradient: undefined,
							},
					  }
					: newStyle
			),
		};

		// When migrating from color.gradient to background.gradient, preserve
		// the has-background class so existing styles relying on it (e.g.
		// theme padding) are not silently broken. Only add the class when a
		// gradient value is being set — not when it is being cleared/reset.
		// Conversely, if the gradient is cleared and has-background was added
		// during a previous migration, remove it so it does not linger.
		if ( isMigrating && !! newStyle?.background?.gradient ) {
			newAttributes.className = clsx( className, 'has-background' );
		} else if (
			! newStyle?.background?.gradient &&
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

	// When background.gradient is supported but not yet explicitly set, fall
	// back to color.gradient for display. Any write from this panel migrates
	// the value to background.gradient and clears color.gradient atomically.
	const styleValue =
		backgroundGradientSupported &&
		! style?.background?.gradient &&
		style?.color?.gradient
			? {
					...style,
					background: {
						...style?.background,
						gradient: style?.color?.gradient,
					},
			  }
			: style;

	const updatedSettings = {
		...settings,
		background: {
			...settings.background,
			backgroundSize:
				settings?.background?.backgroundSize &&
				hasBackgroundSupport( name, 'backgroundSize' ),
		},
	};

	const defaultControls = getBlockSupport( name, [
		BACKGROUND_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	return (
		<StylesBackgroundPanel
			inheritedValue={ inheritedValue }
			as={ as }
			panelId={ clientId }
			defaultValues={ BACKGROUND_BLOCK_DEFAULT_VALUES }
			settings={ updatedSettings }
			onChange={ onChange }
			defaultControls={ defaultControls }
			value={ styleValue }
		/>
	);
}

export default {
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport: hasBackgroundSupport,
};
