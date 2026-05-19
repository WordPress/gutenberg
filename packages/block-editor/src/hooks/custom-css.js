/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { processCSSNesting } from '@wordpress/global-styles-engine';
import { useBlockEditingMode } from '../components/block-editing-mode';

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
 * Splits a raw CSS string into top level segments, conditional at rules with
 * blocks (@media, @supports, @layer …) and ordinary rule sets.
 *
 * Each returned item is one of:
 *   { type: 'at-rule', header: string, inner: string }
 *   { type: 'rule',    raw: string }
 *
 * @param {string} css Raw CSS string.
 * @return {Array<Object>} Parsed top-level segments.
 */
function splitCSSTopLevelSegments( css ) {
	const segments = [];
	let i = 0;

	while ( i < css.length ) {
		// Skip whitespace between rules.
		while ( i < css.length && css[ i ].trim() === '' ) {
			i++;
		}
		if ( i >= css.length ) {
			break;
		}

		if ( css[ i ] === '@' ) {
			// Advance to the first '{' or ';'.
			let j = i;
			while ( j < css.length && css[ j ] !== '{' && css[ j ] !== ';' ) {
				j++;
			}

			if ( j < css.length && css[ j ] === '{' ) {
				const header = css.slice( i, j ).trim();
				j++;

				// Walk to the matching closing brace, respecting nesting.
				let depth = 1;
				const innerStart = j;
				while ( j < css.length && depth > 0 ) {
					if ( css[ j ] === '{' ) {
						depth++;
					} else if ( css[ j ] === '}' ) {
						depth--;
					}
					j++;
				}

				segments.push( {
					type: 'at-rule',
					header,
					inner: css.slice( innerStart, j - 1 ),
				} );
				i = j;
			} else if ( j < css.length && css[ j ] === ';' ) {
				segments.push( { type: 'rule', raw: css.slice( i, j + 1 ) } );
				i = j + 1;
			} else {
				i = j;
			}
			continue;
		}

		let j = i;
		let depth = 0;
		let foundBrace = false;
		let end = -1;

		while ( j < css.length ) {
			if ( css[ j ] === '{' ) {
				depth++;
				foundBrace = true;
			} else if ( css[ j ] === '}' ) {
				depth--;
				if ( depth === 0 && foundBrace ) {
					end = j;
					break;
				}
			}
			j++;
		}

		if ( end === -1 ) {
			break;
		}

		segments.push( { type: 'rule', raw: css.slice( i, end + 1 ) } );
		i = end + 1;
	}

	return segments;
}

/**
 * This function splits the raw CSS into top level segments first.  For each
 * conditional at rule it delegates only the inner content to processCSSNesting
 * (so `&` resolution still works as expected), then re-wraps the processed
 * result with the original at rule header.  Plain rule sets are passed through
 * unchanged.
 *
 * @param {string} css      Raw CSS entered by the user.
 * @param {string} selector The block's unique CSS class selector, e.g. `.wp-custom-css-abc`.
 * @return {string} Processed, browser-ready CSS.
 */
export function processCustomBlockCSS( css, selector ) {
	if ( ! css ) {
		return '';
	}

	const output = [];
	const segments = splitCSSTopLevelSegments( css );

	for ( const segment of segments ) {
		if ( segment.type === 'at-rule' ) {
			/*
			 * Recursively process the inner content so that:
			 *
			 *   @supports (display: grid) {
			 *     @media (min-width: 768px) { & { … } }
			 *   }
			 *
			 * is handled correctly at every nesting depth.
			 */
			const processedInner = processCustomBlockCSS(
				segment.inner,
				selector
			);

			if ( processedInner.trim() ) {
				output.push( `${ segment.header } {\n${ processedInner }\n}` );
			}
		} else {
			const processed = processCSSNesting( segment.raw, selector );
			if ( processed.trim() ) {
				output.push( processed );
			}
		}
	}

	return output.join( '\n' );
}

/**
 * Inspector control for custom CSS.
 *
 * @param {Object}   props               Component props.
 * @param {string}   props.blockName     Block name.
 * @param {Function} props.setAttributes Function to set block attributes.
 * @param {Object}   props.style         Block style attribute.
 */
function CustomCSSControl( { blockName, setAttributes, style } ) {
	const blockEditingMode = useBlockEditingMode();

	if ( blockEditingMode !== 'default' ) {
		return null;
	}
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

	// Process the custom CSS with full at rule support (@media, @supports …).
	// Only process if CSS is valid (doesn't contain HTML markup).
	const transformedCSS = useMemo( () => {
		if ( ! isValidCSS ) {
			return undefined;
		}
		return processCustomBlockCSS( customCSS, customCSSSelector );
	}, [ customCSS, customCSSSelector, isValidCSS ] );

	// Inject the CSS via style override.
	useStyleOverride( { css: transformedCSS } );

	// Only add the class if there's valid custom CSS.
	if ( ! isValidCSS ) {
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
