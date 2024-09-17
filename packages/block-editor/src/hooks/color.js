/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport } from '@wordpress/blocks';
import { useMemo, Platform, useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

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
} from './utils';
import { getBackgroundImageClasses } from './background';
import { useSettings } from '../components/use-settings';
import InspectorControls from '../components/inspector-controls';
import {
	useHasColorPanel,
	default as StylesColorPanel,
} from '../components/global-styles/color-panel';
import BlockColorContrastChecker from './contrast-checker';
import { store as blockEditorStore } from '../store';

export const COLOR_SUPPORT_KEY = 'color';

const hasColorSupport = ( blockNameOrType ) => {
	const colorSupport = getBlockSupport( blockNameOrType, COLOR_SUPPORT_KEY );
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

const hasGradientSupport = ( blockNameOrType ) => {
	const colorSupport = getBlockSupport( blockNameOrType, COLOR_SUPPORT_KEY );

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
 * @param {Object}        props           Additional props applied to save element.
 * @param {Object|string} blockNameOrType Block type.
 * @param {Object}        attributes      Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( props, blockNameOrType, attributes ) {
	if (
		! hasColorSupport( blockNameOrType ) ||
		shouldSkipSerialization( blockNameOrType, COLOR_SUPPORT_KEY )
	) {
		return props;
	}

	const hasGradient = hasGradientSupport( blockNameOrType );

	// I'd have preferred to avoid the "style" attribute usage here
	const { backgroundColor, textColor, gradient, style } = attributes;

	const shouldSerialize = ( feature ) =>
		! shouldSkipSerialization(
			blockNameOrType,
			COLOR_SUPPORT_KEY,
			feature
		);

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

	const newClassName = clsx( props.className, textClass, gradientClass, {
		// Don't apply the background class if there's a custom gradient.
		[ backgroundClass ]:
			( ! hasGradient || ! style?.color?.gradient ) && !! backgroundClass,
		'has-text-color':
			shouldSerialize( 'text' ) && ( textColor || style?.color?.text ),
		'has-background': serializeHasBackground && hasBackground,
		'has-link-color':
			shouldSerialize( 'link' ) && style?.elements?.link?.color,
	} );
	props.className = newClassName ? newClassName : undefined;

	return props;
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

export function ColorEdit( { clientId, name, setAttributes, settings } ) {
	const isEnabled = useHasColorPanel( settings );
	function selector( select ) {
		const { style, textColor, backgroundColor, gradient } =
			select( blockEditorStore ).getBlockAttributes( clientId ) || {};
		return { style, textColor, backgroundColor, gradient };
	}
	const { style, textColor, backgroundColor, gradient } = useSelect(
		selector,
		[ clientId ]
	);
	const value = useMemo( () => {
		return attributesToStyle( {
			style,
			textColor,
			backgroundColor,
			gradient,
		} );
	}, [ style, textColor, backgroundColor, gradient ] );

	const onChange = ( newStyle ) => {
		setAttributes( styleToAttributes( newStyle ) );
	};

	if ( ! isEnabled ) {
		return null;
	}

	const defaultControls = getBlockSupport( name, [
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
			getBlockSupport( name, [
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
				getBlockSupport( name, [
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

function useBlockProps( {
	name,
	backgroundColor,
	textColor,
	gradient,
	style,
} ) {
	const [ userPalette, themePalette, defaultPalette ] = useSettings(
		'color.palette.custom',
		'color.palette.theme',
		'color.palette.default'
	);

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
		return {};
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

	const saveProps = addSaveProps( { style: extraStyles }, name, {
		textColor,
		backgroundColor,
		gradient,
		style,
	} );

	const hasBackgroundValue =
		backgroundColor ||
		style?.color?.background ||
		gradient ||
		style?.color?.gradient;

	return {
		...saveProps,
		className: clsx(
			saveProps.className,
			// Add background image classes in the editor, if not already handled by background color values.
			! hasBackgroundValue && getBackgroundImageClasses( style )
		),
	};
}

export default {
	useBlockProps,
	addSaveProps,
	attributeKeys: [ 'backgroundColor', 'textColor', 'gradient', 'style' ],
	hasSupport: hasColorSupport,
};

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
	'blocks.switchToBlockType.transformedBlock',
	'core/color/addTransforms',
	addTransforms
);
