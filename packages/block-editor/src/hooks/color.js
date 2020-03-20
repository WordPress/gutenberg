/**
 * External dependencies
 */
import classnames from 'classnames';

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
// This should be moved out of the components folder
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
	if ( ! settings.attributes?.backgroundColor ) {
		settings.attributes = Object.assign( settings.attributes, {
			backgroundColor: {
				type: 'object',
			},
		} );
	}
	if ( ! settings.attributes?.textColor ) {
		settings.attributes = Object.assign( settings.attributes, {
			textColor: {
				type: 'object',
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
		'has-text-color': textColor || style?.textColor,
		'has-background': backgroundColor || style?.backgroundColor,
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

	// TODO: check performance impact of running this on each render
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
			const newStyle = {
				...style,
				[ name ]: colorObject && colorObject.slug ? undefined : value,
			};
			const newNamedColor =
				colorObject && colorObject.slug ? colorObject.slug : undefined;
			props.setAttributes( {
				style: newStyle,
				[ name ]: newNamedColor,
			} );
		};

		return [
			<ColorPanel
				key="colors"
				clientId={ props.clientId }
				colorSettings={ [
					{
						label: __( 'Text Color' ),
						onChange: onChangeColor( 'textColor' ),
						colors,
						value: getColorObjectByAttributeValues(
							colors,
							textColor,
							style?.textColor
						).color,
					},
					{
						label: __( 'Background Color' ),
						onChange: onChangeColor( 'backgroundColor' ),
						colors,
						value: getColorObjectByAttributeValues(
							colors,
							backgroundColor,
							style?.backgroundColor
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
