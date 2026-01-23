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
			!! support?.backgroundRepeat
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
	return hasBackgroundImageValue( style ) ? 'has-background' : '';
}

function BackgroundInspectorControl( { children } ) {
	const resetAllFilter = useCallback( ( attributes ) => {
		return {
			...attributes,
			style: {
				...attributes.style,
				background: undefined,
			},
		};
	}, [] );
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
	const { style, inheritedValue } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } =
				select( blockEditorStore );
			const _settings = getSettings();
			return {
				style: getBlockAttributes( clientId )?.style,
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

	if (
		! useHasBackgroundPanel( settings ) ||
		! hasBackgroundSupport( name, 'backgroundImage' )
	) {
		return null;
	}

	const onChange = ( newStyle ) => {
		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
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

	const defaultControls = getBlockSupport( name, [
		BACKGROUND_SUPPORT_KEY,
		'defaultControls',
	] );

	return (
		<StylesBackgroundPanel
			inheritedValue={ inheritedValue }
			as={ BackgroundInspectorControl }
			panelId={ clientId }
			defaultValues={ BACKGROUND_BLOCK_DEFAULT_VALUES }
			settings={ updatedSettings }
			onChange={ onChange }
			defaultControls={ defaultControls }
			value={ style }
		/>
	);
}

export default {
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport: hasBackgroundSupport,
};
