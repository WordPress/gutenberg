/**
 * External dependencies
 */
import { get, has, isEmpty, kebabCase, omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext, createPortal } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import {
	getBlockSupport,
	hasBlockSupport,
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
} from '@wordpress/blocks';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';
import { getCSSRules } from '@wordpress/style-engine';

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
import { SPACING_SUPPORT_KEY, DimensionsPanel } from './dimensions';
import useDisplayBlockControls from '../components/use-display-block-controls';
import { shouldSkipSerialization } from './utils';

const styleSupportKeys = [
	...TYPOGRAPHY_SUPPORT_KEYS,
	BORDER_SUPPORT_KEY,
	COLOR_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
];

const hasStyleSupport = ( blockType ) =>
	styleSupportKeys.some( ( key ) => hasBlockSupport( blockType, key ) );

const VARIABLE_REFERENCE_PREFIX = 'var:';
const VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE = '|';
const VARIABLE_PATH_SEPARATOR_TOKEN_STYLE = '--';
function compileStyleValue( uncompiledValue ) {
	if ( uncompiledValue?.startsWith?.( VARIABLE_REFERENCE_PREFIX ) ) {
		const variable = uncompiledValue
			.slice( VARIABLE_REFERENCE_PREFIX.length )
			.split( VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE )
			.join( VARIABLE_PATH_SEPARATOR_TOKEN_STYLE );
		return `var(--wp--${ variable })`;
	}
	return uncompiledValue;
}

/**
 * Returns the inline styles to add depending on the style object
 *
 * @param {Object} styles Styles configuration.
 *
 * @return {Object} Flattened CSS variables declaration.
 */
export function getInlineStyles( styles = {} ) {
	const ignoredStyles = [ 'spacing.blockGap' ];
	const output = {};
	Object.keys( STYLE_PROPERTY ).forEach( ( propKey ) => {
		if ( STYLE_PROPERTY[ propKey ].rootOnly ) {
			return;
		}
		const path = STYLE_PROPERTY[ propKey ].value;
		const subPaths = STYLE_PROPERTY[ propKey ].properties;
		// Ignore styles on elements because they are handled on the server.
		if ( has( styles, path ) && 'elements' !== path?.[ 0 ] ) {
			// Checking if style value is a string allows for shorthand css
			// option and backwards compatibility for border radius support.
			const styleValue = get( styles, path );

			if ( ! STYLE_PROPERTY[ propKey ].useEngine ) {
				if ( !! subPaths && typeof styleValue !== 'string' ) {
					Object.entries( subPaths ).forEach( ( entry ) => {
						const [ name, subPath ] = entry;
						const value = get( styleValue, [ subPath ] );

						if ( value ) {
							output[ name ] = compileStyleValue( value );
						}
					} );
				} else if ( ! ignoredStyles.includes( path.join( '.' ) ) ) {
					output[ propKey ] = compileStyleValue(
						get( styles, path )
					);
				}
			}
		}
	} );

	// The goal is to move everything to server side generated engine styles
	// This is temporary as we absorb more and more styles into the engine.
	const extraRules = getCSSRules( styles );
	extraRules.forEach( ( rule ) => {
		output[ rule.key ] = rule.value;
	} );

	return output;
}

function compileElementsStyles( selector, elements = {} ) {
	return Object.entries( elements )
		.map( ( [ element, styles ] ) => {
			const elementStyles = getInlineStyles( styles );
			if ( ! isEmpty( elementStyles ) ) {
				// The .editor-styles-wrapper selector is required on elements styles. As it is
				// added to all other editor styles, not providing it causes reset and global
				// styles to override element styles because of higher specificity.
				return [
					`.editor-styles-wrapper .${ selector } ${ ELEMENTS[ element ] }{`,
					...Object.entries( elementStyles ).map(
						( [ cssProperty, value ] ) =>
							`\t${ kebabCase( cssProperty ) }: ${ value };`
					),
					'}',
				].join( '\n' );
			}
			return '';
		} )
		.join( '\n' );
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
	[ `${ SPACING_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		'spacing',
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
			style = omit( style, path );
		}

		if ( Array.isArray( skipSerialization ) ) {
			skipSerialization.forEach( ( featureName ) => {
				const feature = renamedFeatures[ featureName ] || featureName;
				style = omit( style, [ [ ...path, feature ] ] );
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
 * Override the default block element to include duotone styles.
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

		// The Elements API only supports link colors for now,
		// hence the specific omission of `link` in the elements styles.
		// This might need to be refactored or removed if the Elements API
		// changes or `link` supports styles beyond `color`.
		const elements = skipLinkColorSerialization
			? omit( props.attributes.style?.elements, [ 'link' ] )
			: props.attributes.style?.elements;

		const styles = compileElementsStyles(
			blockElementsContainerIdentifier,
			elements
		);
		const element = useContext( BlockList.__unstableElementContext );

		return (
			<>
				{ elements &&
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
						elements
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
