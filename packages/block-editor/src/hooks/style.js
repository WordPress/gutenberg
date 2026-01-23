/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import {
	getBlockSupport,
	hasBlockSupport,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
} from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { getCSSRules, compileCSS } from '@wordpress/style-engine';

/**
 * Internal dependencies
 */
import { BACKGROUND_SUPPORT_KEY, BackgroundImagePanel } from './background';
import { BORDER_SUPPORT_KEY, BorderPanel, SHADOW_SUPPORT_KEY } from './border';
import { COLOR_SUPPORT_KEY, ColorEdit } from './color';
import {
	TypographyPanel,
	TYPOGRAPHY_SUPPORT_KEY,
	TYPOGRAPHY_SUPPORT_KEYS,
} from './typography';
import {
	DIMENSIONS_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
	DimensionsPanel,
} from './dimensions';
import {
	shouldSkipSerialization,
	useStyleOverride,
	useBlockSettings,
} from './utils';
import { scopeSelector } from '../components/global-styles/utils';
import { useBlockEditingMode } from '../components/block-editing-mode';

const styleSupportKeys = [
	...TYPOGRAPHY_SUPPORT_KEYS,
	BORDER_SUPPORT_KEY,
	COLOR_SUPPORT_KEY,
	DIMENSIONS_SUPPORT_KEY,
	BACKGROUND_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
	SHADOW_SUPPORT_KEY,
];

const hasStyleSupport = ( nameOrType ) =>
	styleSupportKeys.some( ( key ) => hasBlockSupport( nameOrType, key ) );

/**
 * Returns the inline styles to add depending on the style object
 *
 * @param {Object} styles Styles configuration.
 *
 * @return {Object} Flattened CSS variables declaration.
 */
export function getInlineStyles( styles = {} ) {
	const output = {};
	// The goal is to move everything to server side generated engine styles
	// This is temporary as we absorb more and more styles into the engine.
	getCSSRules( styles ).forEach( ( rule ) => {
		output[ rule.key ] = rule.value;
	} );

	return output;
}

/**
 * Filters registered block settings, extending attributes to include `style` attribute.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttribute( settings ) {
	if ( ! hasStyleSupport( settings ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( ! settings.attributes.style ) {
		Object.assign( settings.attributes, {
			style: {
				type: 'object',
			},
		} );
	}

	return settings;
}

/**
 * A dictionary of paths to flag skipping block support serialization as the key,
 * with values providing the style paths to be omitted from serialization.
 *
 * @constant
 * @type {Record<string, string[]>}
 */
const skipSerializationPathsEdit = {
	[ `${ BORDER_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [ 'border' ],
	[ `${ COLOR_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		COLOR_SUPPORT_KEY,
	],
	[ `${ TYPOGRAPHY_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		TYPOGRAPHY_SUPPORT_KEY,
	],
	[ `${ DIMENSIONS_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		DIMENSIONS_SUPPORT_KEY,
	],
	[ `${ SPACING_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		SPACING_SUPPORT_KEY,
	],
	[ `${ SHADOW_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		SHADOW_SUPPORT_KEY,
	],
};

/**
 * A dictionary of paths to flag skipping block support serialization as the key,
 * with values providing the style paths to be omitted from serialization.
 *
 * Extends the Edit skip paths to enable skipping additional paths in just
 * the Save component. This allows a block support to be serialized within the
 * editor, while using an alternate approach, such as server-side rendering, when
 * the support is saved.
 *
 * @constant
 * @type {Record<string, string[]>}
 */
const skipSerializationPathsSave = {
	...skipSerializationPathsEdit,
	[ `${ DIMENSIONS_SUPPORT_KEY }.aspectRatio` ]: [
		`${ DIMENSIONS_SUPPORT_KEY }.aspectRatio`,
	], // Skip serialization of aspect ratio in save mode.
	[ `${ BACKGROUND_SUPPORT_KEY }` ]: [ BACKGROUND_SUPPORT_KEY ], // Skip serialization of background support in save mode.
};

const skipSerializationPathsSaveChecks = {
	[ `${ DIMENSIONS_SUPPORT_KEY }.aspectRatio` ]: true,
	[ `${ BACKGROUND_SUPPORT_KEY }` ]: true,
};

/**
 * A dictionary used to normalize feature names between support flags, style
 * object properties and __experimentSkipSerialization configuration arrays.
 *
 * This allows not having to provide a migration for a support flag and possible
 * backwards compatibility bridges, while still achieving consistency between
 * the support flag and the skip serialization array.
 *
 * @constant
 * @type {Record<string, string>}
 */
const renamedFeatures = { gradients: 'gradient' };

/**
 * A utility function used to remove one or more paths from a style object.
 * Works in a way similar to Lodash's `omit()`. See unit tests and examples below.
 *
 * It supports a single string path:
 *
 * ```
 * omitStyle( { color: 'red' }, 'color' ); // {}
 * ```
 *
 * or an array of paths:
 *
 * ```
 * omitStyle( { color: 'red', background: '#fff' }, [ 'color', 'background' ] ); // {}
 * ```
 *
 * It also allows you to specify paths at multiple levels in a string.
 *
 * ```
 * omitStyle( { typography: { textDecoration: 'underline' } }, 'typography.textDecoration' ); // {}
 * ```
 *
 * You can remove multiple paths at the same time:
 *
 * ```
 * omitStyle(
 * 		{
 * 			typography: {
 * 				textDecoration: 'underline',
 * 				textTransform: 'uppercase',
 * 			}
 *		},
 *		[
 * 			'typography.textDecoration',
 * 			'typography.textTransform',
 *		]
 * );
 * // {}
 * ```
 *
 * You can also specify nested paths as arrays:
 *
 * ```
 * omitStyle(
 * 		{
 * 			typography: {
 * 				textDecoration: 'underline',
 * 				textTransform: 'uppercase',
 * 			}
 *		},
 *		[
 * 			[ 'typography', 'textDecoration' ],
 * 			[ 'typography', 'textTransform' ],
 *		]
 * );
 * // {}
 * ```
 *
 * With regards to nesting of styles, infinite depth is supported:
 *
 * ```
 * omitStyle(
 * 		{
 * 			border: {
 * 				radius: {
 * 					topLeft: '10px',
 * 					topRight: '0.5rem',
 * 				}
 * 			}
 *		},
 *		[
 * 			[ 'border', 'radius', 'topRight' ],
 *		]
 * );
 * // { border: { radius: { topLeft: '10px' } } }
 * ```
 *
 * The third argument, `preserveReference`, defines how to treat the input style object.
 * It is mostly necessary to properly handle mutation when recursively handling the style object.
 * Defaulting to `false`, this will always create a new object, avoiding to mutate `style`.
 * However, when recursing, we change that value to `true` in order to work with a single copy
 * of the original style object.
 *
 * @see https://lodash.com/docs/4.17.15#omit
 *
 * @param {Object}       style             Styles object.
 * @param {Array|string} paths             Paths to remove.
 * @param {boolean}      preserveReference True to mutate the `style` object, false otherwise.
 * @return {Object}      Styles object with the specified paths removed.
 */
export function omitStyle( style, paths, preserveReference = false ) {
	if ( ! style ) {
		return style;
	}

	let newStyle = style;
	if ( ! preserveReference ) {
		newStyle = JSON.parse( JSON.stringify( style ) );
	}

	if ( ! Array.isArray( paths ) ) {
		paths = [ paths ];
	}

	paths.forEach( ( path ) => {
		if ( ! Array.isArray( path ) ) {
			path = path.split( '.' );
		}

		if ( path.length > 1 ) {
			const [ firstSubpath, ...restPath ] = path;
			omitStyle( newStyle[ firstSubpath ], [ restPath ], true );
		} else if ( path.length === 1 ) {
			delete newStyle[ path[ 0 ] ];
		}
	} );

	return newStyle;
}

/**
 * Override props assigned to save component to inject the CSS variables definition.
 *
 * @param {Object}                    props           Additional props applied to save element.
 * @param {Object|string}             blockNameOrType Block type.
 * @param {Object}                    attributes      Block attributes.
 * @param {?Record<string, string[]>} skipPaths       An object of keys and paths to skip serialization.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps(
	props,
	blockNameOrType,
	attributes,
	skipPaths = skipSerializationPathsSave
) {
	if ( ! hasStyleSupport( blockNameOrType ) ) {
		return props;
	}

	let { style } = attributes;
	Object.entries( skipPaths ).forEach( ( [ indicator, path ] ) => {
		const skipSerialization =
			skipSerializationPathsSaveChecks[ indicator ] ||
			getBlockSupport( blockNameOrType, indicator );

		if ( skipSerialization === true ) {
			style = omitStyle( style, path );
		}

		if ( Array.isArray( skipSerialization ) ) {
			skipSerialization.forEach( ( featureName ) => {
				const feature = renamedFeatures[ featureName ] || featureName;
				style = omitStyle( style, [ [ ...path, feature ] ] );
			} );
		}
	} );

	props.style = {
		...getInlineStyles( style ),
		...props.style,
	};

	return props;
}

function BlockStyleControls( {
	clientId,
	name,
	setAttributes,
	__unstableParentLayout,
} ) {
	const settings = useBlockSettings( name, __unstableParentLayout );
	const blockEditingMode = useBlockEditingMode();
	const passedProps = {
		clientId,
		name,
		setAttributes,
		settings: {
			...settings,
			typography: {
				...settings.typography,
				// The text alignment UI for individual blocks is rendered in
				// the block toolbar, so disable it here.
				textAlign: false,
			},
		},
	};
	if ( blockEditingMode !== 'default' ) {
		return null;
	}
	return (
		<>
			<ColorEdit { ...passedProps } />
			<BackgroundImagePanel { ...passedProps } />
			<TypographyPanel { ...passedProps } />
			<BorderPanel { ...passedProps } />
			<DimensionsPanel { ...passedProps } />
		</>
	);
}

export default {
	edit: BlockStyleControls,
	hasSupport: hasStyleSupport,
	addSaveProps,
	attributeKeys: [ 'style' ],
	useBlockProps,
};

// Defines which element types are supported, including their hover styles or
// any other elements that have been included under a single element type
// e.g. heading and h1-h6.
const elementTypes = [
	{ elementType: 'button' },
	{ elementType: 'link', pseudo: [ ':hover' ] },
	{
		elementType: 'heading',
		elements: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
	},
];

// Used for generating the instance ID
const STYLE_BLOCK_PROPS_REFERENCE = {};

function useBlockProps( { name, style } ) {
	const blockElementsContainerIdentifier = useInstanceId(
		STYLE_BLOCK_PROPS_REFERENCE,
		'wp-elements'
	);

	const baseElementSelector = `.${ blockElementsContainerIdentifier }`;
	const blockElementStyles = style?.elements;

	const styles = useMemo( () => {
		if ( ! blockElementStyles ) {
			return;
		}

		const elementCSSRules = [];

		elementTypes.forEach( ( { elementType, pseudo, elements } ) => {
			const skipSerialization = shouldSkipSerialization(
				name,
				COLOR_SUPPORT_KEY,
				elementType
			);

			if ( skipSerialization ) {
				return;
			}

			const elementStyles = blockElementStyles?.[ elementType ];

			// Process primary element type styles.
			if ( elementStyles ) {
				const selector = scopeSelector(
					baseElementSelector,
					ELEMENTS[ elementType ]
				);

				elementCSSRules.push(
					compileCSS( elementStyles, { selector } )
				);

				// Process any interactive states for the element type.
				if ( pseudo ) {
					pseudo.forEach( ( pseudoSelector ) => {
						if ( elementStyles[ pseudoSelector ] ) {
							elementCSSRules.push(
								compileCSS( elementStyles[ pseudoSelector ], {
									selector: scopeSelector(
										baseElementSelector,
										`${ ELEMENTS[ elementType ] }${ pseudoSelector }`
									),
								} )
							);
						}
					} );
				}
			}

			// Process related elements e.g. h1-h6 for headings
			if ( elements ) {
				elements.forEach( ( element ) => {
					if ( blockElementStyles[ element ] ) {
						elementCSSRules.push(
							compileCSS( blockElementStyles[ element ], {
								selector: scopeSelector(
									baseElementSelector,
									ELEMENTS[ element ]
								),
							} )
						);
					}
				} );
			}
		} );

		return elementCSSRules.length > 0
			? elementCSSRules.join( '' )
			: undefined;
	}, [ baseElementSelector, blockElementStyles, name ] );

	useStyleOverride( { css: styles } );

	return addSaveProps(
		{ className: blockElementsContainerIdentifier },
		name,
		{ style },
		skipSerializationPathsEdit
	);
}

addFilter(
	'blocks.registerBlockType',
	'core/style/addAttribute',
	addAttribute
);
