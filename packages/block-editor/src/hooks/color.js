/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport } from '@wordpress/blocks';
import { useMemo, Platform, useCallback } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	getColorClassName,
	getColorObjectByAttributeValues,
} from '../components/colors';
import { __experimentalGetGradientClass } from '../components/gradients';
import {
	cleanEmptyObject,
	transformStyles,
	shouldSkipSerialization,
	useBlockSettings,
} from './utils';
import useSetting from '../components/use-setting';
import InspectorControls from '../components/inspector-controls';
import {
	useHasColorPanel,
	default as StylesColorPanel,
} from '../components/global-styles/color-panel';
import BlockColorContrastChecker from './contrast-checker';

export const COLOR_SUPPORT_KEY = 'color';

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

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.link
	);
};

const hasGradientSupport = ( blockType ) => {
	const colorSupport = getBlockSupport( blockType, COLOR_SUPPORT_KEY );

	return (
		colorSupport !== null &&
		typeof colorSupport === 'object' &&
		!! colorSupport.gradients
	);
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
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttributes( settings ) {
	if ( ! hasColorSupport( settings ) ) {
		return settings;
	}

	// Allow blocks to specify their own attribute definition with default values if needed.
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
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( props, blockType, attributes ) {
	if (
		! hasColorSupport( blockType ) ||
		shouldSkipSerialization( blockType, COLOR_SUPPORT_KEY )
	) {
		return props;
	}

	const hasGradient = hasGradientSupport( blockType );

	// I'd have preferred to avoid the "style" attribute usage here
	const { backgroundColor, textColor, gradient, style } = attributes;

	const shouldSerialize = ( feature ) =>
		! shouldSkipSerialization( blockType, COLOR_SUPPORT_KEY, feature );

	// Primary color classes must come before the `has-text-color`,
	// `has-background` and `has-link-color` classes to maintain backwards
	// compatibility and avoid block invalidations.
	const textClass = shouldSerialize( 'text' )
		? getColorClassName( 'color', textColor )
		: undefined;

	const gradientClass = shouldSerialize( 'gradients' )
		? __experimentalGetGradientClass( gradient )
		: undefined;

	const backgroundClass = shouldSerialize( 'background' )
		? getColorClassName( 'background-color', backgroundColor )
		: undefined;

	const serializeHasBackground =
		shouldSerialize( 'background' ) || shouldSerialize( 'gradients' );
	const hasBackground =
		backgroundColor ||
		style?.color?.background ||
		( hasGradient && ( gradient || style?.color?.gradient ) );

	const newClassName = classnames(
		props.className,
		textClass,
		gradientClass,
		{
			// Don't apply the background class if there's a custom gradient.
			[ backgroundClass ]:
				( ! hasGradient || ! style?.color?.gradient ) &&
				!! backgroundClass,
			'has-text-color':
				shouldSerialize( 'text' ) &&
				( textColor || style?.color?.text ),
			'has-background': serializeHasBackground && hasBackground,
			'has-link-color':
				shouldSerialize( 'link' ) && style?.elements?.link?.color,
		}
	);
	props.className = newClassName ? newClassName : undefined;

	return props;
}

/**
 * Filters registered block settings to extend the block edit wrapper
 * to apply the desired styles and classnames properly.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addEditProps( settings ) {
	if (
		! hasColorSupport( settings ) ||
		shouldSkipSerialization( settings, COLOR_SUPPORT_KEY )
	) {
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

function styleToAttributes( style ) {
	const textColorValue = style?.color?.text;
	const textColorSlug = textColorValue?.startsWith( 'var:preset|color|' )
		? textColorValue.substring( 'var:preset|color|'.length )
		: undefined;
	const backgroundColorValue = style?.color?.background;
	const backgroundColorSlug = backgroundColorValue?.startsWith(
		'var:preset|color|'
	)
		? backgroundColorValue.substring( 'var:preset|color|'.length )
		: undefined;
	const gradientValue = style?.color?.gradient;
	const gradientSlug = gradientValue?.startsWith( 'var:preset|gradient|' )
		? gradientValue.substring( 'var:preset|gradient|'.length )
		: undefined;
	const updatedStyle = { ...style };
	updatedStyle.color = {
		...updatedStyle.color,
		text: textColorSlug ? undefined : textColorValue,
		background: backgroundColorSlug ? undefined : backgroundColorValue,
		gradient: gradientSlug ? undefined : gradientValue,
	};
	return {
		style: cleanEmptyObject( updatedStyle ),
		textColor: textColorSlug,
		backgroundColor: backgroundColorSlug,
		gradient: gradientSlug,
	};
}

function attributesToStyle( attributes ) {
	return {
		...attributes.style,
		color: {
			...attributes.style?.color,
			text: attributes.textColor
				? 'var:preset|color|' + attributes.textColor
				: attributes.style?.color?.text,
			background: attributes.backgroundColor
				? 'var:preset|color|' + attributes.backgroundColor
				: attributes.style?.color?.background,
			gradient: attributes.gradient
				? 'var:preset|gradient|' + attributes.gradient
				: attributes.style?.color?.gradient,
		},
	};
}

function ColorInspectorControl( { children, resetAllFilter } ) {
	const attributesResetAllFilter = useCallback(
		( attributes ) => {
			const existingStyle = attributesToStyle( attributes );
			const updatedStyle = resetAllFilter( existingStyle );
			return {
				...attributes,
				...styleToAttributes( updatedStyle ),
			};
		},
		[ resetAllFilter ]
	);

	return (
		<InspectorControls
			group="color"
			resetAllFilter={ attributesResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

export function ColorEdit( props ) {
	const { clientId, name, attributes, setAttributes } = props;
	const settings = useBlockSettings( name );
	const isEnabled = useHasColorPanel( settings );
	const value = useMemo( () => {
		return attributesToStyle( {
			style: attributes.style,
			textColor: attributes.textColor,
			backgroundColor: attributes.backgroundColor,
			gradient: attributes.gradient,
		} );
	}, [
		attributes.style,
		attributes.textColor,
		attributes.backgroundColor,
		attributes.gradient,
	] );

	const onChange = ( newStyle ) => {
		setAttributes( styleToAttributes( newStyle ) );
	};

	if ( ! isEnabled ) {
		return null;
	}

	const defaultControls = getBlockSupport( props.name, [
		COLOR_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	const enableContrastChecking =
		Platform.OS === 'web' &&
		! value?.color?.gradient &&
		( settings?.color?.text || settings?.color?.link ) &&
		// Contrast checking is enabled by default.
		// Deactivating it requires `enableContrastChecker` to have
		// an explicit value of `false`.
		false !==
			getBlockSupport( props.name, [
				COLOR_SUPPORT_KEY,
				'enableContrastChecker',
			] );

	return (
		<StylesColorPanel
			as={ ColorInspectorControl }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			defaultControls={ defaultControls }
			enableContrastChecker={
				false !==
				getBlockSupport( props.name, [
					COLOR_SUPPORT_KEY,
					'enableContrastChecker',
				] )
			}
		>
			{ enableContrastChecking && (
				<BlockColorContrastChecker clientId={ clientId } />
			) }
		</StylesColorPanel>
	);
}

/**
 * This adds inline styles for color palette colors.
 * Ideally, this is not needed and themes should load their palettes on the editor.
 *
 * @param {Function} BlockListBlock Original component.
 *
 * @return {Function} Wrapped component.
 */
export const withColorPaletteStyles = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		const { name, attributes } = props;
		const { backgroundColor, textColor } = attributes;
		const userPalette = useSetting( 'color.palette.custom' );
		const themePalette = useSetting( 'color.palette.theme' );
		const defaultPalette = useSetting( 'color.palette.default' );
		const colors = useMemo(
			() => [
				...( userPalette || [] ),
				...( themePalette || [] ),
				...( defaultPalette || [] ),
			],
			[ userPalette, themePalette, defaultPalette ]
		);
		if (
			! hasColorSupport( name ) ||
			shouldSkipSerialization( name, COLOR_SUPPORT_KEY )
		) {
			return <BlockListBlock { ...props } />;
		}
		const extraStyles = {};

		if (
			textColor &&
			! shouldSkipSerialization( name, COLOR_SUPPORT_KEY, 'text' )
		) {
			extraStyles.color = getColorObjectByAttributeValues(
				colors,
				textColor
			)?.color;
		}
		if (
			backgroundColor &&
			! shouldSkipSerialization( name, COLOR_SUPPORT_KEY, 'background' )
		) {
			extraStyles.backgroundColor = getColorObjectByAttributeValues(
				colors,
				backgroundColor
			)?.color;
		}

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

const MIGRATION_PATHS = {
	linkColor: [ [ 'style', 'elements', 'link', 'color', 'text' ] ],
	textColor: [ [ 'textColor' ], [ 'style', 'color', 'text' ] ],
	backgroundColor: [
		[ 'backgroundColor' ],
		[ 'style', 'color', 'background' ],
	],
	gradient: [ [ 'gradient' ], [ 'style', 'color', 'gradient' ] ],
};

export function addTransforms( result, source, index, results ) {
	const destinationBlockType = result.name;
	const activeSupports = {
		linkColor: hasLinkColorSupport( destinationBlockType ),
		textColor: hasTextColorSupport( destinationBlockType ),
		backgroundColor: hasBackgroundColorSupport( destinationBlockType ),
		gradient: hasGradientSupport( destinationBlockType ),
	};
	return transformStyles(
		activeSupports,
		MIGRATION_PATHS,
		result,
		source,
		index,
		results
	);
}

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

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/color/addTransforms',
	addTransforms
);
