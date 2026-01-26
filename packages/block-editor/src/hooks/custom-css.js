/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { processCSSNesting } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import AdvancedPanel, {
	validateCSS,
} from '../components/global-styles/advanced-panel';
import { cleanEmptyObject, useStyleOverride } from './utils';
import { store as blockEditorStore } from '../store';

// Stable reference for useInstanceId.
const CUSTOM_CSS_INSTANCE_REFERENCE = {};

// Stable empty object reference for useSelect.
const EMPTY_STYLE = {};

/**
 * Inspector control for custom CSS.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.blockName     Block name.
 * @param {Function} props.setAttributes Function to set block attributes.
 * @param {Object}   props.style         Block style attribute.
 */
function CustomCSSControl( { blockName, setAttributes, style } ) {
	const blockType = getBlockType( blockName );

	function onChange( newStyle ) {
		// Normalize whitespace-only CSS to undefined so it gets cleaned up.
		const css = newStyle?.css?.trim() ? newStyle.css : undefined;
		setAttributes( {
			style: cleanEmptyObject( { ...newStyle, css } ),
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
				value={ style }
				onChange={ onChange }
				inheritedValue={ style }
				help={ cssHelpText }
			/>
		</InspectorControls>
	);
}

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
 * @param {Object} props       Block props.
 * @param {Object} props.style Block style attribute.
 * @return {Object} Block props including className for custom CSS scoping.
 */
function useBlockProps( { style } ) {
	const customCSS = style?.css;

	// Validate CSS is non-empty and passes validation checks.
	const isValidCSS =
		typeof customCSS === 'string' &&
		customCSS.trim().length > 0 &&
		validateCSS( customCSS );

	const customCSSIdentifier = useInstanceId(
		CUSTOM_CSS_INSTANCE_REFERENCE,
		'wp-custom-css'
	);

	const customCSSSelector = `.${ customCSSIdentifier }`;

	// Transform the custom CSS using the same logic as global styles.
	// Only process if CSS is valid (doesn't contain HTML markup).
	const transformedCSS = useMemo( () => {
		if ( ! isValidCSS ) {
			return undefined;
		}
		return processCSSNesting( customCSS, customCSSSelector );
	}, [ customCSS, customCSSSelector, isValidCSS ] );

	// Inject the CSS via style override.
	useStyleOverride( { css: transformedCSS } );

	// Only add the class if there's valid custom CSS.
	if ( ! isValidCSS ) {
		return {};
	}

	return {
		className: customCSSIdentifier,
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

	if ( ! attributes?.style?.css?.trim() ) {
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
