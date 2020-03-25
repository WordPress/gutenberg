/**
 * External dependencies
 */
import classnames from 'classnames';
import { pickBy, isEqual, isObject, identity, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getColorClassName,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
} from '../components/colors';
import PanelColorSettings from '../components/panel-color-settings';
import ContrastChecker from '../components/contrast-checker';
import InspectorControls from '../components/inspector-controls';
import { getBlockDOMNode } from '../utils/dom';

export const COLOR_SUPPORT_KEY = '__experimentalColor';

export const cleanEmptyObject = ( object ) => {
	if ( ! isObject( object ) ) {
		return object;
	}
	const cleanedNestedObjects = pickBy(
		mapValues( object, cleanEmptyObject ),
		identity
	);
	return isEqual( cleanedNestedObjects, {} )
		? undefined
		: cleanedNestedObjects;
};

/**
 * Filters registered block settings, extending attributes to include
 * `backgroundColor` and `textColor` attribute.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addAttributes( settings ) {
	if ( ! hasBlockSupport( settings, COLOR_SUPPORT_KEY ) ) {
		return settings;
	}

	// allow blocks to specify their own attribute definition with default values if needed.
	if ( ! settings.attributes.backgroundColor ) {
		Object.assign( settings.attributes, {
			backgroundColor: {
				type: 'string',
			},
		} );
	}
	if ( ! settings.attributes.textColor ) {
		Object.assign( settings.attributes, {
			textColor: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject colors classnames.
 *
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
 */
export function addSaveProps( props, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, COLOR_SUPPORT_KEY ) ) {
		return props;
	}

	// I'd have prefered to avoid the "style" attribute usage here
	const { backgroundColor, textColor, style } = attributes;

	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);
	const textClass = getColorClassName( 'color', textColor );
	props.className = classnames( props.className, backgroundClass, textClass, {
		'has-text-color': textColor || style?.color?.text,
		'has-background': backgroundColor || style?.color?.background,
	} );

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
	if ( ! hasBlockSupport( settings, COLOR_SUPPORT_KEY ) ) {
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

const ColorPanel = ( { colorSettings, clientId } ) => {
	const { getComputedStyle, Node } = window;

	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();

	useEffect( () => {
		const colorsDetectionElement = getBlockDOMNode( clientId );
		setDetectedColor( getComputedStyle( colorsDetectionElement ).color );

		let backgroundColorNode = colorsDetectionElement;
		let backgroundColor = getComputedStyle( backgroundColorNode )
			.backgroundColor;
		while (
			backgroundColor === 'rgba(0, 0, 0, 0)' &&
			backgroundColorNode.parentNode &&
			backgroundColorNode.parentNode.nodeType === Node.ELEMENT_NODE
		) {
			backgroundColorNode = backgroundColorNode.parentNode;
			backgroundColor = getComputedStyle( backgroundColorNode )
				.backgroundColor;
		}

		setDetectedBackgroundColor( backgroundColor );
	} );

	return (
		<InspectorControls>
			<PanelColorSettings
				title={ __( 'Color settings' ) }
				initialOpen={ false }
				colorSettings={ colorSettings }
			>
				<ContrastChecker
					backgroundColor={ detectedBackgroundColor }
					textColor={ detectedColor }
				/>
			</PanelColorSettings>
		</InspectorControls>
	);
};

/**
 * Override the default edit UI to include new inspector controls for block
 * color, if block defines support.
 *
 * @param  {Function} BlockEdit Original component
 * @return {Function}           Wrapped component
 */
export const withBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name: blockName } = props;
		const colors = useSelect( ( select ) => {
			return select( 'core/block-editor' ).getSettings().colors;
		}, [] );

		if ( ! hasBlockSupport( blockName, COLOR_SUPPORT_KEY ) ) {
			return <BlockEdit key="edit" { ...props } />;
		}
		const { style, textColor, backgroundColor } = props.attributes;

		const onChangeColor = ( name ) => ( value ) => {
			const colorObject = getColorObjectByColorValue( colors, value );
			const attributeName = name + 'Color';
			const newStyle = {
				...style,
				color: {
					...style?.color,
					[ name ]: colorObject?.slug ? undefined : value,
				},
			};
			const newNamedColor = colorObject?.slug
				? colorObject.slug
				: undefined;
			props.setAttributes( {
				style: cleanEmptyObject( newStyle ),
				[ attributeName ]: newNamedColor,
			} );
		};

		return [
			<ColorPanel
				key="colors"
				clientId={ props.clientId }
				colorSettings={ [
					{
						label: __( 'Text Color' ),
						onChange: onChangeColor( 'text' ),
						colors,
						value: getColorObjectByAttributeValues(
							colors,
							textColor,
							style?.color?.text
						).color,
					},
					{
						label: __( 'Background Color' ),
						onChange: onChangeColor( 'background' ),
						colors,
						value: getColorObjectByAttributeValues(
							colors,
							backgroundColor,
							style?.color?.background
						).color,
					},
				] }
			/>,
			<BlockEdit key="edit" { ...props } />,
		];
	},
	'withToolbarControls'
);

addFilter(
	'blocks.registerBlockType',
	'core/color/addAttribute',
	addAttributes
);

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/color/addSaveProps',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/color/addEditProps',
	addEditProps
);

addFilter(
	'editor.BlockEdit',
	'core/color/with-block-controls',
	withBlockControls
);
