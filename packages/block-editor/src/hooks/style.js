/**
 * External dependencies
 */
import {
	capitalize,
	find,
	first,
	forEach,
	get,
	has,
	isEmpty,
	isEqual,
	kebabCase,
	map,
	omit,
	startsWith,
	without,
} from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import {
	getBlockSupport,
	hasBlockSupport,
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
	__EXPERIMENTAL_ELEMENTS as ELEMENTS,
} from '@wordpress/blocks';
import { createHigherOrderComponent, useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BORDER_SUPPORT_KEY, BorderPanel } from './border';
import { COLOR_SUPPORT_KEY, ColorEdit } from './color';
import { FONT_SIZE_SUPPORT_KEY } from './font-size';
import { TypographyPanel, TYPOGRAPHY_SUPPORT_KEYS } from './typography';
import {
	DIMENSIONS_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
	DimensionsPanel,
} from './dimensions';
import useDisplayBlockControls from '../components/use-display-block-controls';

const styleSupportKeys = [
	...TYPOGRAPHY_SUPPORT_KEYS,
	BORDER_SUPPORT_KEY,
	COLOR_SUPPORT_KEY,
	DIMENSIONS_SUPPORT_KEY,
	SPACING_SUPPORT_KEY,
];

const hasStyleSupport = ( blockType ) =>
	styleSupportKeys.some( ( key ) => hasBlockSupport( blockType, key ) );

const VARIABLE_REFERENCE_PREFIX = 'var:';
const VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE = '|';
const VARIABLE_PATH_SEPARATOR_TOKEN_STYLE = '--';
function compileStyleValue( uncompiledValue ) {
	if ( startsWith( uncompiledValue, VARIABLE_REFERENCE_PREFIX ) ) {
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
 * @param  {Object} styles Styles configuration
 * @return {Object}        Flattened CSS variables declaration
 */
export function getInlineStyles( styles = {} ) {
	const output = {};
	Object.keys( STYLE_PROPERTY ).forEach( ( propKey ) => {
		const path = STYLE_PROPERTY[ propKey ].value;
		const subPaths = STYLE_PROPERTY[ propKey ].properties;
		// Ignore styles on elements because they are handled on the server.
		if ( has( styles, path ) && 'elements' !== first( path ) ) {
			if ( !! subPaths ) {
				subPaths.forEach( ( suffix ) => {
					output[
						propKey + capitalize( suffix )
					] = compileStyleValue( get( styles, [ ...path, suffix ] ) );
				} );
			} else {
				output[ propKey ] = compileStyleValue( get( styles, path ) );
			}
		}
	} );

	return output;
}

function compileElementsStyles( selector, elements = {} ) {
	return map( elements, ( styles, element ) => {
		const elementStyles = getInlineStyles( styles );
		if ( ! isEmpty( elementStyles ) ) {
			return [
				`.${ selector } ${ ELEMENTS[ element ] }{`,
				...map(
					elementStyles,
					( value, property ) =>
						`\t${ kebabCase( property ) }: ${ value }${
							element === 'link' ? '!important' : ''
						};`
				),
				'}',
			].join( '\n' );
		}
		return '';
	} ).join( '\n' );
}

/**
 * Filters registered block settings, extending attributes to include `style` attribute.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addAttribute( settings ) {
	if ( ! hasStyleSupport( settings ) ) {
		return settings;
	}

	// allow blocks to specify their own attribute definition with default values if needed.
	if ( ! settings.attributes.style ) {
		Object.assign( settings.attributes, {
			style: {
				type: 'object',
			},
		} );
	}

	return settings;
}

const skipSerializationPaths = {
	[ `${ BORDER_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [ 'border' ],
	[ `${ COLOR_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		COLOR_SUPPORT_KEY,
	],
	[ `${ DIMENSIONS_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		'dimensions',
	],
	[ `${ SPACING_SUPPORT_KEY }.__experimentalSkipSerialization` ]: [
		'spacing',
	],
	[ `__experimentalSkipFontSizeSerialization` ]: [ 'typography', 'fontSize' ],
	[ `__experimentalSkipTypographySerialization` ]: without(
		TYPOGRAPHY_SUPPORT_KEYS,
		FONT_SIZE_SUPPORT_KEY
	).map(
		( feature ) =>
			find( STYLE_PROPERTY, ( property ) =>
				isEqual( property.support, [ feature ] )
			)?.value
	),
};

/**
 * Override props assigned to save component to inject the CSS variables definition.
 *
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
 */
export function addSaveProps( props, blockType, attributes ) {
	if ( ! hasStyleSupport( blockType ) ) {
		return props;
	}

	let { style } = attributes;

	forEach( skipSerializationPaths, ( path, indicator ) => {
		if ( getBlockSupport( blockType, indicator ) ) {
			style = omit( style, path );
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
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
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

		return addSaveProps( props, settings, attributes );
	};

	return settings;
}

/**
 * Override the default edit UI to include new inspector controls for
 * all the custom styles configs.
 *
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
export const withBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const shouldDisplayControls = useDisplayBlockControls();

		return (
			<>
				{ shouldDisplayControls && (
					<>
						<TypographyPanel { ...props } />
						<BorderPanel { ...props } />
						<ColorEdit { ...props } />
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
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
const withElementsStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const elements = props.attributes.style?.elements;
		if ( ! elements ) {
			return <BlockListBlock { ...props } />;
		}
		const blockElementsContainerIdentifier = `wp-elements-${ useInstanceId(
			BlockListBlock
		) }`;
		const styles = compileElementsStyles(
			blockElementsContainerIdentifier,
			props.attributes.style?.elements
		);

		return (
			<>
				<style
					dangerouslySetInnerHTML={ {
						__html: styles,
					} }
				/>
				<BlockListBlock
					{ ...props }
					className={ classnames(
						props.classname,
						blockElementsContainerIdentifier
					) }
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
