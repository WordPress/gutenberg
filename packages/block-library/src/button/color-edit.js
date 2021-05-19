/**
 * External dependencies
 */
import { pickBy, isEqual, isObject, identity, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useState,
	useEffect,
	useRef,
	useMemo,
	Platform,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
	getGradientValueBySlug,
	getGradientSlugByValue,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	ContrastChecker,
	InspectorControls,
	useSetting,
} from '@wordpress/block-editor';

const EMPTY_ARRAY = [];

const isWebPlatform = Platform.OS === 'web';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

// The code in this file is copied entirely from the "color" and "style" support flags
// The flag can't be used at the moment because of the extra wrapper around
// the button block markup.

function getBlockDOMNode( clientId ) {
	return document.getElementById( 'block-' + clientId );
}

/**
 * Removed undefined values from nested object.
 *
 * @param {*} object
 * @return {*} Object cleaned from undefined values
 */
const cleanEmptyObject = ( object ) => {
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

function ColorPanel( { settings, clientId, enableContrastChecking = true } ) {
	const [ detectedBackgroundColor, setDetectedBackgroundColor ] = useState();
	const [ detectedColor, setDetectedColor ] = useState();

	const title = __( 'Color' );

	useEffect( () => {
		if ( isWebPlatform && ! enableContrastChecking ) {
			return;
		}

		const colorsDetectionElement = getBlockDOMNode( clientId );
		if ( ! colorsDetectionElement ) {
			return;
		}
		setDetectedColor( getComputedStyle( colorsDetectionElement ).color );

		let backgroundColorNode = colorsDetectionElement;
		let backgroundColor = getComputedStyle( backgroundColorNode )
			.backgroundColor;
		while (
			backgroundColor === 'rgba(0, 0, 0, 0)' &&
			backgroundColorNode.parentNode &&
			backgroundColorNode.parentNode.nodeType ===
				backgroundColorNode.parentNode.ELEMENT_NODE
		) {
			backgroundColorNode = backgroundColorNode.parentNode;
			backgroundColor = getComputedStyle( backgroundColorNode )
				.backgroundColor;
		}

		setDetectedBackgroundColor( backgroundColor );
	} );

	return (
		<InspectorControls>
			<PanelColorGradientSettings
				title={ title }
				initialOpen={ false }
				settings={ settings }
			>
				{ isWebPlatform && enableContrastChecking && (
					<ContrastChecker
						backgroundColor={ detectedBackgroundColor }
						textColor={ detectedColor }
					/>
				) }
			</PanelColorGradientSettings>
		</InspectorControls>
	);
}

/**
 * Inspector control panel containing the color related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Color edit element.
 */
function ColorEdit( props ) {
	const { attributes } = props;
	const colors = useSetting( 'color.palette' ) || EMPTY_ARRAY;
	const gradients = useSetting( 'color.gradients' ) || EMPTY_ARRAY;

	// Shouldn't be needed but right now the ColorGradientsPanel
	// can trigger both onChangeColor and onChangeBackground
	// synchronously causing our two callbacks to override changes
	// from each other.
	const localAttributes = useRef( attributes );
	useEffect( () => {
		localAttributes.current = attributes;
	}, [ attributes ] );

	const { style, textColor, backgroundColor, gradient } = attributes;
	let gradientValue;
	if ( gradient ) {
		gradientValue = getGradientValueBySlug( gradients, gradient );
	} else {
		gradientValue = style?.color?.gradient;
	}

	const onChangeColor = ( name ) => ( value ) => {
		const colorObject = getColorObjectByColorValue( colors, value );
		const attributeName = name + 'Color';
		const newStyle = {
			...localAttributes.current.style,
			color: {
				...localAttributes.current?.style?.color,
				[ name ]: colorObject?.slug ? undefined : value,
			},
		};

		const newNamedColor = colorObject?.slug ? colorObject.slug : undefined;
		const newAttributes = {
			style: cleanEmptyObject( newStyle ),
			[ attributeName ]: newNamedColor,
		};

		props.setAttributes( newAttributes );
		localAttributes.current = {
			...localAttributes.current,
			...newAttributes,
		};
	};

	const onChangeGradient = ( value ) => {
		const slug = getGradientSlugByValue( gradients, value );
		let newAttributes;
		if ( slug ) {
			const newStyle = {
				...localAttributes.current?.style,
				color: {
					...localAttributes.current?.style?.color,
					gradient: undefined,
				},
			};
			newAttributes = {
				style: cleanEmptyObject( newStyle ),
				gradient: slug,
			};
		} else {
			const newStyle = {
				...localAttributes.current?.style,
				color: {
					...localAttributes.current?.style?.color,
					gradient: value,
				},
			};
			newAttributes = {
				style: cleanEmptyObject( newStyle ),
				gradient: undefined,
			};
		}
		props.setAttributes( newAttributes );
		localAttributes.current = {
			...localAttributes.current,
			...newAttributes,
		};
	};

	const settings = useMemo( () => {
		return [
			{
				label: __( 'Text color' ),
				onColorChange: onChangeColor( 'text' ),
				colorValue: getColorObjectByAttributeValues(
					colors,
					textColor,
					style?.color?.text
				).color,
			},
			{
				label: __( 'Background color' ),
				onColorChange: onChangeColor( 'background' ),
				colorValue: getColorObjectByAttributeValues(
					colors,
					backgroundColor,
					style?.color?.background
				).color,
				gradientValue,
				onGradientChange: onChangeGradient,
			},
		];
	}, [
		colors,
		textColor,
		backgroundColor,
		gradientValue,
		style?.color?.text,
		style?.color?.background,
	] );

	return (
		<ColorPanel
			enableContrastChecking={ ! gradient && ! style?.color?.gradient }
			clientId={ props.clientId }
			settings={ settings }
		/>
	);
}

export default ColorEdit;
