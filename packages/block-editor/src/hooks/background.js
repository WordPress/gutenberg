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

export function setBackgroundStyleDefaults( backgroundStyle ) {
	if ( ! backgroundStyle ) {
		return;
	}

	const backgroundImage = backgroundStyle?.backgroundImage;
	let backgroundStylesWithDefaults;

	// Set block background defaults.
	if ( backgroundImage?.source === 'file' && !! backgroundImage?.url ) {
		if ( ! backgroundStyle?.backgroundSize ) {
			backgroundStylesWithDefaults = {
				backgroundSize: 'cover',
			};
		}

		if (
			'contain' === backgroundStyle?.backgroundSize &&
			! backgroundStyle?.backgroundPosition
		) {
			backgroundStylesWithDefaults = {
				backgroundPosition: 'center',
			};
		}
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

export default {
	useBlockProps,
	attributeKeys: [ 'style' ],
	hasSupport: hasBackgroundSupport,
};
