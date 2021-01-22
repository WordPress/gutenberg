/**
 * External dependencies
 */
import classnames from 'classnames';
import { isObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useRef, useEffect, Platform } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getColorClassName,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
} from '../components/colors';
import {
	__experimentalGetGradientClass,
	getGradientValueBySlug,
	getGradientSlugByValue,
} from '../components/gradients';
import { cleanEmptyObject } from './utils';
import ColorPanel from './color-panel';
import useEditorFeature from '../components/use-editor-feature';

export const COLOR_SUPPORT_KEY = 'color';
const EMPTY_ARRAY = [];

const hasColorSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );
	return (
		colorSupport &&
		( colorSupport.link === true ||
			colorSupport.gradient === true ||
			colorSupport.background !== false ||
			colorSupport.text !== false )
	);
};

const hasLinkColorSupport = ( blockType ) => {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return isObject( colorSupport ) && !! colorSupport.link;
};

const hasGradientSupport = ( blockType ) => {
	if ( Platform.OS !== 'web' ) {
		return false;
	}

	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return isObject( colorSupport ) && !! colorSupport.gradients;
};

const hasBackgroundColorSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return colorSupport && colorSupport.background !== false;
};

const hasTextColorSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return colorSupport && colorSupport.text !== false;
};

/**
 * Filters registered block settings, extending attributes to include
 * `backgroundColor` and `textColor` attribute.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
function addAttributes( settings ) {
	if ( ! hasColorSupport( settings ) ) {
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

	if ( hasGradientSupport( settings ) && ! settings.attributes.gradient ) {
		Object.assign( settings.attributes, {
			gradient: {
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
	if ( ! hasColorSupport( blockType ) ) {
		return props;
	}

	const hasGradient = hasGradientSupport( blockType );

	// I'd have prefered to avoid the "style" attribute usage here
	const { backgroundColor, textColor, gradient, style } = attributes;

	const backgroundClass = getColorClassName(
		'background-color',
		backgroundColor
	);
	const gradientClass = __experimentalGetGradientClass( gradient );
	const textClass = getColorClassName( 'color', textColor );
	const newClassName = classnames(
		props.className,
		textClass,
		gradientClass,
		{
			// Don't apply the background class if there's a custom gradient
			[ backgroundClass ]:
				( ! hasGradient || ! style?.color?.gradient ) &&
				!! backgroundClass,
			'has-text-color': textColor || style?.color?.text,
			'has-background':
				backgroundColor ||
				style?.color?.background ||
				( hasGradient && ( gradient || style?.color?.gradient ) ),
			'has-link-color': style?.color?.link,
		}
	);
	props.className = newClassName ? newClassName : undefined;

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
	if ( ! hasColorSupport( settings ) ) {
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

const getLinkColorFromAttributeValue = ( colors, value ) => {
	const attributeParsed = /var:preset\|color\|(.+)/.exec( value );
	if ( attributeParsed && attributeParsed[ 1 ] ) {
		return getColorObjectByAttributeValues( colors, attributeParsed[ 1 ] )
			.color;
	}
	return value;
};

/**
 * Inspector control panel containing the color related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Color edit element.
 */
export function ColorEdit( props ) {
	const { name: blockName, attributes } = props;
	const isLinkColorEnabled = useEditorFeature( 'color.link' );
	const colors = useEditorFeature( 'color.palette' ) || EMPTY_ARRAY;
	const gradients = useEditorFeature( 'color.gradients' ) || EMPTY_ARRAY;

	// Shouldn't be needed but right now the ColorGradientsPanel
	// can trigger both onChangeColor and onChangeBackground
	// synchronously causing our two callbacks to override changes
	// from each other.
	const localAttributes = useRef( attributes );
	useEffect( () => {
		localAttributes.current = attributes;
	}, [ attributes ] );

	if ( ! hasColorSupport( blockName ) || Platform.OS !== 'web' ) {
		return null;
	}

	const hasBackground = hasBackgroundColorSupport( blockName );
	const hasGradient = hasGradientSupport( blockName );

	const { style, textColor, backgroundColor, gradient } = attributes;
	let gradientValue;
	if ( hasGradient && gradient ) {
		gradientValue = getGradientValueBySlug( gradients, gradient );
	} else if ( hasGradient ) {
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

	const onChangeLinkColor = ( value ) => {
		const colorObject = getColorObjectByColorValue( colors, value );
		props.setAttributes( {
			style: {
				...props.attributes.style,
				color: {
					...props.attributes.style?.color,
					link: colorObject?.slug
						? `var:preset|color|${ colorObject.slug }`
						: value,
				},
			},
		} );
	};

	return (
		<ColorPanel
			enableContrastChecking={
				// Turn on contrast checker for web only since it's not supported on mobile yet.
				Platform.OS === 'web' && ! gradient && ! style?.color?.gradient
			}
			clientId={ props.clientId }
			settings={ [
				...( hasTextColorSupport( blockName )
					? [
							{
								label: __( 'Text Color' ),
								onColorChange: onChangeColor( 'text' ),
								colorValue: getColorObjectByAttributeValues(
									colors,
									textColor,
									style?.color?.text
								).color,
							},
					  ]
					: [] ),
				...( hasBackground || hasGradient
					? [
							{
								label: __( 'Background Color' ),
								onColorChange: hasBackground
									? onChangeColor( 'background' )
									: undefined,
								colorValue: getColorObjectByAttributeValues(
									colors,
									backgroundColor,
									style?.color?.background
								).color,
								gradientValue,
								onGradientChange: hasGradient
									? onChangeGradient
									: undefined,
							},
					  ]
					: [] ),
				...( isLinkColorEnabled && hasLinkColorSupport( blockName )
					? [
							{
								label: __( 'Link Color' ),
								onColorChange: onChangeLinkColor,
								colorValue: getLinkColorFromAttributeValue(
									colors,
									style?.color?.link
								),
								clearable: !! props.attributes.style?.color
									?.link,
							},
					  ]
					: [] ),
			] }
		/>
	);
}

/*
I expect this should either go somewhere else, already exists somewhere else and that should be used instead, or should be done differently.
*/
function hasThemeSupport( supportFlag ) {
	return useSelect( ( select ) => {
		const { getThemeSupports } = select( 'core' );
		const themeSupports = getThemeSupports();

		//TODO: The value of themeSupports appears to be cached in a way that I can't bust.
		//It is pre-loaded in a <script id='wp-api-fetch-js-after'> and the value doesn't reflect
		//what is CURRENTLY set by a theme (by adjusting values set by add_theme_support in functions.php).
		//I have not been able to find the code that queues this 'wp-api-fetch-js-after' inline script
		//to determine what's happening.
		//Instead it appears to be some historical value. Even attempting this on a completely fresh
		//WordPress installation didn't provide the values expected.
		//Also attempted was to bump the version in the theme I am testing with, but to no avail.  The
		//changed VERSION (via style.css) of the theme IS correctly expressed in that preloaded data...
		//but the value of themeSupports is not.
		console.log(
			'theme supports ',
			supportFlag,
			themeSupports[ supportFlag ] !== undefined,
			themeSupports
		);

		return themeSupports && themeSupports[ supportFlag ] !== undefined;
	} );
}
/**
 * This adds inline styles for color palette colors.
 * Ideally, this is not needed and themes should load their palettes on the editor.
 *
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
export const withColorPaletteStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, attributes } = props;
		const { backgroundColor, textColor } = attributes;
		const colors = useEditorFeature( 'color.palette' ) || EMPTY_ARRAY;
		if ( ! hasColorSupport( name ) ) {
			return <BlockListBlock { ...props } />;
		}

		const editorPaletteIncluded = hasThemeSupport(
			'editor-palette-included'
		);
		if ( editorPaletteIncluded ) {
			return <BlockListBlock { ...props } />;
		}

		const extraStyles = {
			color: textColor
				? getColorObjectByAttributeValues( colors, textColor )?.color
				: undefined,
			backgroundColor: backgroundColor
				? getColorObjectByAttributeValues( colors, backgroundColor )
						?.color
				: undefined,
		};

		let wrapperProps = props.wrapperProps;
		wrapperProps = {
			...props.wrapperProps,
			style: {
				...extraStyles,
				...props.wrapperProps?.style,
			},
		};

		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	}
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
	'editor.BlockListBlock',
	'core/color/with-color-palette-styles',
	withColorPaletteStyles
);
