/**
 * External dependencies
 */
import { capitalize, get, has, omit, omitBy, startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import {
	getBlockSupport,
	hasBlockSupport,
	__EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY,
} from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BORDER_SUPPORT_KEY, BorderPanel } from './border';
import { COLOR_SUPPORT_KEY, ColorEdit } from './color';
import { FONT_SIZE_SUPPORT_KEY } from './font-size';
import { TypographyPanel, TYPOGRAPHY_SUPPORT_KEYS } from './typography';
import { SPACING_SUPPORT_KEY, PaddingEdit } from './padding';
import SpacingPanelControl from '../components/spacing-panel-control';

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
		if ( has( styles, path ) ) {
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

/**
 * Filters a style object returning only the keys
 * that are serializable for a given block.
 *
 * @param {Object} style Input style object to filter.
 * @param {Object} blockSupports Info about block supports.
 * @return {Object} Filtered style.
 */
export function omitKeysNotToSerialize( style, blockSupports ) {
	return omitBy(
		style,
		( value, key ) =>
			!! blockSupports[ key ]?.__experimentalSkipSerialization
	);
}

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

	const { style } = attributes;
	let filteredStyle = omitKeysNotToSerialize( style, {
		border: getBlockSupport( blockType, BORDER_SUPPORT_KEY ),
		[ COLOR_SUPPORT_KEY ]: getBlockSupport( blockType, COLOR_SUPPORT_KEY ),
	} );

	if (
		getBlockSupport( blockType, '__experimentalSkipFontSizeSerialization' )
	) {
		filteredStyle = omit( filteredStyle, [
			[ 'typography', FONT_SIZE_SUPPORT_KEY ],
		] );
	}

	props.style = {
		...getInlineStyles( filteredStyle ),
		...props.style,
	};

	return props;
}

/**
 * Filters registered block settings to extand the block edit wrapper
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
		const { name: blockName } = props;

		const hasSpacingSupport = hasBlockSupport(
			blockName,
			SPACING_SUPPORT_KEY
		);

		return [
			<TypographyPanel key="typography" { ...props } />,
			<BorderPanel key="border" { ...props } />,
			<ColorEdit key="colors" { ...props } />,
			<BlockEdit key="edit" { ...props } />,
			hasSpacingSupport && (
				<SpacingPanelControl key="spacing">
					<PaddingEdit { ...props } />
				</SpacingPanelControl>
			),
		];
	},
	'withToolbarControls'
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
