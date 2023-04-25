/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext, useMemo, createPortal } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import {
	getBlockSupport,
	hasBlockSupport,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
} from '@wordpress/blocks';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { getCSSRules, compileCSS } from '@wordpress/style-engine';

/**
 * Internal dependencies
 */
import BlockList from '../components/block-list';
import { BORDER_SUPPORT_KEY, BorderPanel } from './border';
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
import useDisplayBlockControls from '../components/use-display-block-controls';
import { shouldSkipSerialization } from './utils';

const styleSupportKeys = [
	...TYPOGRAPHY_SUPPORT_KEYS,
	BORDER_SUPPORT_KEY,
	COLOR_SUPPORT_KEY,
	DIMENSIONS_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
];

const hasStyleSupport = ( blockType ) =>
	styleSupportKeys.some( ( key ) => hasBlockSupport( blockType, key ) );

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
	[ `${ SPACING_SUPPORT_KEY }` ]: [ 'spacing.blockGap' ],
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
 * @param {Object}                    props      Additional props applied to save element.
 * @param {Object}                    blockType  Block type.
 * @param {Object}                    attributes Block attributes.
 * @param {?Record<string, string[]>} skipPaths  An object of keys and paths to skip serialization.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps(
	props,
	blockType,
	attributes,
	skipPaths = skipSerializationPathsSave
) {
	if ( ! hasStyleSupport( blockType ) ) {
		return props;
	}

	let { style } = attributes;
	Object.entries( skipPaths ).forEach( ( [ indicator, path ] ) => {
		const skipSerialization = getBlockSupport( blockType, indicator );

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

/**
 * Filters registered block settings to extend the block edit wrapper
 * to apply the desired styles and classnames properly.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object}.Filtered block settings.
 */
export function addEditProps( settings ) {
	if ( ! hasStyleSupport( settings ) ) {
		return settings;
	}

	const existingGetEditWrapperProps = settings.getEditWrapperProps;
	settings.getEditWrapperProps = ( attributes ) => {
		let props = {};
		if ( existingGetEditWrapperProps ) {
			props = existingGetEditWrapperProps( attributes );
		}

		return addSaveProps(
			props,
			settings,
			attributes,
			skipSerializationPathsEdit
		);
	};

	return settings;
}

/**
 * Override the default edit UI to include new inspector controls for
 * all the custom styles configs.
 *
 * @param {Function} BlockEdit Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const shouldDisplayControls = useDisplayBlockControls();

		return (
			<>
				{ shouldDisplayControls && (
					<>
						<ColorEdit { ...props } />
						<TypographyPanel { ...props } />
						<BorderPanel { ...props } />
						<DimensionsPanel { ...props } />
					</>
				) }
				<BlockEdit { ...props } />
			</>
		);
	},
	'withToolbarControls'
);

/**
 * Override the default block element to include elements styles.
 *
 * @param {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
const withElementsStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const blockElementsContainerIdentifier = `wp-elements-${ useInstanceId(
			BlockListBlock
		) }`;

		const skipLinkColorSerialization = shouldSkipSerialization(
			props.name,
			COLOR_SUPPORT_KEY,
			'link'
		);

		const styles = useMemo( () => {
			// The .editor-styles-wrapper selector is required on elements styles. As it is
			// added to all other editor styles, not providing it causes reset and global
			// styles to override element styles because of higher specificity.
			const elements = [
				{
					styles: ! skipLinkColorSerialization
						? props.attributes.style?.elements?.link
						: undefined,
					selector: `.editor-styles-wrapper .${ blockElementsContainerIdentifier } ${ ELEMENTS.link }`,
				},
				{
					styles: ! skipLinkColorSerialization
						? props.attributes.style?.elements?.link?.[ ':hover' ]
						: undefined,
					selector: `.editor-styles-wrapper .${ blockElementsContainerIdentifier } ${ ELEMENTS.link }:hover`,
				},
			];
			const elementCssRules = [];
			for ( const { styles: elementStyles, selector } of elements ) {
				if ( elementStyles ) {
					const cssRule = compileCSS( elementStyles, {
						selector,
					} );
					elementCssRules.push( cssRule );
				}
			}
			return elementCssRules.length > 0
				? elementCssRules.join( '' )
				: undefined;
		}, [
			props.attributes.style?.elements,
			blockElementsContainerIdentifier,
			skipLinkColorSerialization,
		] );

		const element = useContext( BlockList.__unstableElementContext );

		return (
			<>
				{ styles &&
					element &&
					createPortal(
						<style
							dangerouslySetInnerHTML={ {
								__html: styles,
							} }
						/>,
						element
					) }

				<BlockListBlock
					{ ...props }
					className={
						props.attributes.style?.elements
							? classnames(
									props.className,
									blockElementsContainerIdentifier
							  )
							: props.className
					}
				/>
			</>
		);
	}
);

addFilter(
	'blocks.registerBlockType',
	'core/style/addAttribute',
	addAttribute
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/style/addSaveProps',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/style/addEditProps',
	addEditProps
);

addFilter(
	'editor.BlockEdit',
	'core/style/with-block-controls',
	withBlockControls
);

addFilter(
	'editor.BlockListBlock',
	'core/editor/with-elements-styles',
	withElementsStyles
);
