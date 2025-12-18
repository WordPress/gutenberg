/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { getBlockType } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { processCSSNesting } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import AdvancedPanel from '../components/global-styles/advanced-panel';
import { cleanEmptyObject, useStyleOverride } from './utils';
import { store as blockEditorStore } from '../store';

// Stable reference for useInstanceId.
const CUSTOM_CSS_INSTANCE_REFERENCE = {};

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
		setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	}

	const cssHelpText = sprintf(
		// translators: %s: is the name of a block e.g., 'Image' or 'Quote'.
		__(
			'Add your own CSS to customize the appearance of the %s block. You do not need to include a CSS selector, just add the property and value.'
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
	const style = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes( clientId )?.style ||
			{},
		[ clientId ]
	);

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

	const customCSSIdentifier = useInstanceId(
		CUSTOM_CSS_INSTANCE_REFERENCE,
		'wp-custom-css'
	);

	const customCSSSelector = `.${ customCSSIdentifier }`;

	// Transform the custom CSS using the same logic as global styles.
	const transformedCSS = useMemo( () => {
		return processCSSNesting( customCSS, customCSSSelector );
	}, [ customCSS, customCSSSelector ] );

	// Inject the CSS via style override.
	useStyleOverride( { css: transformedCSS } );

	// Only add the class if there's custom CSS.
	if ( ! customCSS ) {
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
	if ( ! attributes?.style?.css ) {
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
	hasSupport() {
		return true;
	},
};
