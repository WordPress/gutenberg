/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { safeDecodeURI, isURL } from '@wordpress/url';

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
import { ROOT_BLOCK_SELECTOR } from '../components/global-styles/utils';
import { unlock } from '../lock-unlock';

export const BACKGROUND_SUPPORT_KEY = 'background';

// Initial control values where no block style is set.
const BACKGROUND_DEFAULT_VALUES = {
	backgroundSize: 'cover',
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

/**
 * Updates a styles object with default background values.
 *
 * @param {Object} blockStyles           A styles object.
 * @param {Object} options               Optional settings.
 * @param {string} options.stylesheetURI The URI of the current theme directory.
 * @param {string} options.selector      The block selector.
 * @return {Object}                     Updated styles.
 */
export function setBackgroundStyleDefaults( blockStyles, options ) {
	if (
		typeof blockStyles?.background !== 'object' ||
		Object.keys( blockStyles?.background ).length === 0
	) {
		return blockStyles;
	}

	const backgroundImage = blockStyles?.background?.backgroundImage;
	const newBackgroundStyles = {};

	// Set block background defaults.
	if ( options?.selector !== ROOT_BLOCK_SELECTOR && !! backgroundImage ) {
		if ( ! blockStyles?.background?.backgroundSize ) {
			newBackgroundStyles.backgroundSize = 'cover';
		}

		if (
			'contain' === blockStyles?.background?.backgroundSize &&
			! blockStyles?.background?.backgroundPosition
		) {
			newBackgroundStyles.backgroundPosition = 'center';
		}
	}

	return {
		...blockStyles,
		background: {
			...blockStyles.background,
			...newBackgroundStyles,
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
	const style = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId )?.style,
		[ clientId ]
	);

	if (
		! useHasBackgroundPanel( settings ) ||
		! hasBackgroundSupport( name, 'backgroundImage' )
	) {
		return null;
	}

	const defaultControls = getBlockSupport( name, [
		BACKGROUND_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

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

	return (
		<StylesBackgroundPanel
			as={ BackgroundInspectorControl }
			panelId={ clientId }
			defaultControls={ defaultControls }
			defaultValues={ BACKGROUND_DEFAULT_VALUES }
			settings={ updatedSettings }
			onChange={ onChange }
			value={ style }
		/>
	);
}

function useBlockProps( { name, style } ) {
	const { backgroundImageURL } = useSelect(
		( select ) => {
			const { getThemeFileURI } = unlock( select( blockEditorStore ) );
			let file = style?.background?.backgroundImage?.url;
			if (
				!! style?.background?.backgroundImage?.url && ! isURL( style?.background?.backgroundImage?.url )
			) {
				file = getThemeFileURI( style.background.backgroundImage.url );
			}
			return {
				backgroundImageURL: file,
			};
		},
		[ style?.background?.backgroundImage ]
	);

	if (
		! hasBackgroundSupport( name, 'backgroundImage' ) ||
		! backgroundImageURL
	) {
		return;
	}
	const newBackgroundStyles = {};
	if ( ! style?.background?.backgroundSize ) {
		newBackgroundStyles.backgroundSize = 'cover';
	}

	if (
		'contain' === style?.background?.backgroundSize &&
		! style?.background?.backgroundPosition
	) {
		newBackgroundStyles.backgroundPosition = 'center';
	}

	return {
		style: {
			// @TODO this should be backgroundImage. How to do that?
			// Also, maybe consider reinstating https://github.com/WordPress/gutenberg/blob/fc98542a7dbba194bb4096d49cd0bd093b63f43e/packages/block-editor/src/hooks/background.js#L82
			backgroundImage: `url( '${ encodeURI(
				safeDecodeURI( backgroundImageURL )
			) }' )`,
			...newBackgroundStyles,
		},
	};
}

export default {
	attributeKeys: [ 'style' ],
	hasSupport: hasBackgroundSupport,
	useBlockProps,
};
