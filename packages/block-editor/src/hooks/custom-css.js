import { useEffect, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import {
	processCSSNesting,
	privateApis as globalStylesEnginePrivateApis,
} from '@wordpress/global-styles-engine';
import { store as noticesStore } from '@wordpress/notices';
import { useBlockEditingMode } from '../components/block-editing-mode';
import InspectorControls from '../components/inspector-controls';
import AdvancedPanel, {
	validateCSS,
} from '../components/global-styles/advanced-panel';
import { useSettings } from '../components/use-settings';
import { cleanEmptyObject, usePrivateStyleOverride } from './utils';
import {
	getStyleForState,
	isDefaultBlockStyleState,
	setStyleForState,
} from './block-style-state';
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';

const { getResponsiveMediaQueries } = unlock( globalStylesEnginePrivateApis );

// Stable reference for useInstanceId.
const CUSTOM_CSS_INSTANCE_REFERENCE = {};

// Stable empty object reference for useSelect.
const EMPTY_STYLE = {};

/**
 * Returns whether a style object (including viewport/pseudo nests) has custom CSS.
 *
 * @param {Object|undefined} style Block style attribute.
 * @return {boolean} Whether any custom CSS is present.
 */
export function styleHasCustomCSS( style ) {
	if ( ! style || typeof style !== 'object' ) {
		return false;
	}

	if ( typeof style.css === 'string' && style.css.trim() ) {
		return true;
	}

	return Object.values( style ).some(
		( value ) =>
			value && typeof value === 'object' && styleHasCustomCSS( value )
	);
}

/**
 * Builds scoped custom CSS rules for the default state and each viewport.
 *
 * @param {Object}           style             Block style attribute.
 * @param {string}           customCSSSelector Selector used to scope nested CSS.
 * @param {Object|undefined} viewportSettings  Viewport settings from theme.json.
 * @return {string|undefined} Combined CSS, or undefined when empty/invalid.
 */
function getCustomCSSRules( style, customCSSSelector, viewportSettings ) {
	const cssRules = [];

	const appendProcessedCSS = ( css, mediaQuery ) => {
		if ( typeof css !== 'string' || ! css.trim() || ! validateCSS( css ) ) {
			return;
		}

		const processed = processCSSNesting( css, customCSSSelector );
		if ( ! processed ) {
			return;
		}

		cssRules.push(
			mediaQuery ? `${ mediaQuery }{${ processed }}` : processed
		);
	};

	appendProcessedCSS( style?.css );

	Object.entries( getResponsiveMediaQueries( viewportSettings ) ).forEach(
		( [ viewport, mediaQuery ] ) => {
			appendProcessedCSS(
				getStyleForState( style, {
					viewport,
					pseudo: 'default',
				} )?.css,
				mediaQuery
			);
		}
	);

	return cssRules.length > 0 ? cssRules.join( '' ) : undefined;
}

/**
 * Inspector control for custom CSS.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.clientId      Block client ID.
 * @param {string}   props.blockName     Block name.
 * @param {Function} props.setAttributes Function to set block attributes.
 * @param {Object}   props.style         Block style attribute.
 */
function CustomCSSControl( { clientId, blockName, setAttributes, style } ) {
	const blockEditingMode = useBlockEditingMode();
	const selectedState = useSelect(
		( select ) => {
			const { getSelectedBlockStyleState } = unlock(
				select( blockEditorStore )
			);
			return getSelectedBlockStyleState( clientId );
		},
		[ clientId ]
	);

	if ( blockEditingMode !== 'default' ) {
		return null;
	}
	const blockType = getBlockType( blockName );
	const isStateSelected = ! isDefaultBlockStyleState( selectedState );
	const stateStyle = isStateSelected
		? getStyleForState( style, selectedState ) || EMPTY_STYLE
		: style;

	function onChange( newStyle ) {
		// Normalize whitespace-only CSS to undefined so it gets cleaned up.
		const css = newStyle?.css?.trim() ? newStyle.css : undefined;
		const nextStateStyle = cleanEmptyObject( { ...newStyle, css } );

		setAttributes( {
			style: isStateSelected
				? setStyleForState( style, selectedState, nextStateStyle )
				: nextStateStyle,
		} );
	}

	const cssHelpText = sprintf(
		// translators: %s: is the name of a block e.g., 'Image' or 'Quote'.
		__(
			'Add your own CSS to customize the appearance of the %s block. You do not need to include a CSS selector, just add the property and value, e.g. color: red;.'
		),
		blockType?.title
	);

	return (
		<InspectorControls group="advanced">
			<AdvancedPanel
				value={ stateStyle }
				onChange={ onChange }
				inheritedValue={ stateStyle }
				help={ cssHelpText }
			/>
		</InspectorControls>
	);
}

const CUSTOM_CSS_WARNING_NOTICE_ID = 'custom-css-edit-warning';

function CustomCSSEdit( { clientId, name, setAttributes } ) {
	const { style, canEditCSS } = useSelect(
		( select ) => {
			const { getBlockAttributes, getSettings } =
				select( blockEditorStore );
			return {
				style: getBlockAttributes( clientId )?.style || EMPTY_STYLE,
				canEditCSS: getSettings().canEditCSS,
			};
		},
		[ clientId ]
	);

	// Don't render the panel if user lacks edit_css capability.
	if ( ! canEditCSS ) {
		return null;
	}

	return (
		<CustomCSSControl
			clientId={ clientId }
			blockName={ name }
			setAttributes={ setAttributes }
			style={ style }
		/>
	);
}

/**
 * Hook to handle custom CSS for a block in the editor.
 * Generates a unique class and applies scoped CSS via style override.
 *
 * @param {Object} props          Block props.
 * @param {Object} props.style    Block style attribute.
 * @param {string} props.clientId Block client ID.
 * @return {Object} Block props including className for custom CSS scoping.
 */
function useBlockProps( { style, clientId } ) {
	const [ viewportSettings ] = useSettings( 'viewport' );

	const canEditCSS = useSelect(
		( select ) => select( blockEditorStore ).getSettings().canEditCSS,
		[]
	);

	const { createWarningNotice } = useDispatch( noticesStore );

	// Show a warning notice when the user lacks edit_css and a block has
	// custom CSS. The fixed notice ID ensures only one notice is shown
	// regardless of how many blocks have CSS.
	const hasCustomCSS = styleHasCustomCSS( style );
	useEffect( () => {
		if ( ! canEditCSS && hasCustomCSS ) {
			createWarningNotice(
				__(
					'This post contains blocks with custom CSS. You do not have permission to edit CSS. If you save this post, the custom CSS will be removed.'
				),
				{
					id: CUSTOM_CSS_WARNING_NOTICE_ID,
					isDismissible: true,
				}
			);
		}
	}, [ canEditCSS, hasCustomCSS, createWarningNotice ] );

	const customCSSIdentifier = useInstanceId(
		CUSTOM_CSS_INSTANCE_REFERENCE,
		'wp-custom-css'
	);

	const customCSSSelector = `.${ customCSSIdentifier }`;

	// Transform the custom CSS using the same logic as global styles.
	// Only process if CSS is valid (doesn't contain HTML markup).
	const transformedCSS = useMemo( () => {
		return getCustomCSSRules( style, customCSSSelector, viewportSettings );
	}, [ style, customCSSSelector, viewportSettings ] );

	// Inject the CSS via style override. The type makes EditorStyles print
	// it after all other overrides (e.g. block style variations), matching
	// the front end where the custom CSS stylesheet is printed last. The
	// clientId keeps custom CSS overrides in block order relative to each
	// other, which is the order they print in on the front end.
	usePrivateStyleOverride( {
		css: transformedCSS,
		clientId,
		__unstableType: 'custom-css',
	} );

	// Only add the class if there's valid custom CSS.
	if ( ! transformedCSS ) {
		return {};
	}

	return {
		className: `has-custom-css ${ customCSSIdentifier }`,
	};
}

/**
 * Adds a marker class to blocks with custom CSS for server-side rendering.
 *
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type definition.
 * @param {Object} attributes Block's attributes.
 * @return {Object} Filtered props applied to save element.
 */
function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, 'customCSS', true ) ) {
		return props;
	}

	if ( ! styleHasCustomCSS( attributes?.style ) ) {
		return props;
	}

	// Add a class to indicate this block has custom CSS.
	// The actual CSS is rendered server-side using the render_block filter.
	const className = props.className
		? `${ props.className } has-custom-css`
		: 'has-custom-css';

	return {
		...props,
		className,
	};
}

export default {
	edit: CustomCSSEdit,
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'style' ],
	hasSupport( name ) {
		return hasBlockSupport( name, 'customCSS', true );
	},
};
