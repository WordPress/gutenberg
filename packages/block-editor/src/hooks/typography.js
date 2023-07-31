/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { useMemo, useCallback } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import {
	default as StylesTypographyPanel,
	useHasTypographyPanel,
} from '../components/global-styles/typography-panel';

import { LINE_HEIGHT_SUPPORT_KEY } from './line-height';
import { FONT_FAMILY_SUPPORT_KEY } from './font-family';
import { FONT_SIZE_SUPPORT_KEY } from './font-size';
import {
	cleanEmptyObject,
	useBlockSettings,
	shouldSkipSerialization,
} from './utils';

function omit( object, keys ) {
	return Object.fromEntries(
		Object.entries( object ).filter( ( [ key ] ) => ! keys.includes( key ) )
	);
}

const LETTER_SPACING_SUPPORT_KEY = 'typography.__experimentalLetterSpacing';
const TEXT_TRANSFORM_SUPPORT_KEY = 'typography.__experimentalTextTransform';
const TEXT_DECORATION_SUPPORT_KEY = 'typography.__experimentalTextDecoration';
const TEXT_COLUMNS_SUPPORT_KEY = 'typography.textColumns';
const FONT_STYLE_SUPPORT_KEY = 'typography.__experimentalFontStyle';
const FONT_WEIGHT_SUPPORT_KEY = 'typography.__experimentalFontWeight';
const WRITING_MODE_SUPPORT_KEY = 'typography.__experimentalWritingMode';
export const TYPOGRAPHY_SUPPORT_KEY = 'typography';
export const TYPOGRAPHY_SUPPORT_KEYS = [
	LINE_HEIGHT_SUPPORT_KEY,
	FONT_SIZE_SUPPORT_KEY,
	FONT_STYLE_SUPPORT_KEY,
	FONT_WEIGHT_SUPPORT_KEY,
	FONT_FAMILY_SUPPORT_KEY,
	TEXT_COLUMNS_SUPPORT_KEY,
	TEXT_DECORATION_SUPPORT_KEY,
	WRITING_MODE_SUPPORT_KEY,
	TEXT_TRANSFORM_SUPPORT_KEY,
	LETTER_SPACING_SUPPORT_KEY,
];

const hasWritingModeSupport = ( blockType ) => {
	const writingModeSupport = getBlockSupport(
		blockType,
		WRITING_MODE_SUPPORT_KEY
	);
	return writingModeSupport;
};

function styleToAttributes( style ) {
	const updatedStyle = { ...omit( style, [ 'fontFamily' ] ) };
	const fontSizeValue = style?.typography?.fontSize;
	const fontFamilyValue = style?.typography?.fontFamily;
	const fontSizeSlug = fontSizeValue?.startsWith( 'var:preset|font-size|' )
		? fontSizeValue.substring( 'var:preset|font-size|'.length )
		: undefined;
	const fontFamilySlug = fontFamilyValue?.startsWith(
		'var:preset|font-family|'
	)
		? fontFamilyValue.substring( 'var:preset|font-family|'.length )
		: undefined;
	updatedStyle.typography = {
		...omit( updatedStyle.typography, [ 'fontFamily' ] ),
		fontSize: fontSizeSlug ? undefined : fontSizeValue,
	};
	return {
		style: cleanEmptyObject( updatedStyle ),
		fontFamily: fontFamilySlug,
		fontSize: fontSizeSlug,
	};
}

function attributesToStyle( attributes ) {
	return {
		...attributes.style,
		typography: {
			...attributes.style?.typography,
			fontFamily: attributes.fontFamily
				? 'var:preset|font-family|' + attributes.fontFamily
				: undefined,
			fontSize: attributes.fontSize
				? 'var:preset|font-size|' + attributes.fontSize
				: attributes.style?.typography?.fontSize,
		},
	};
}

function TypographyInspectorControl( { children, resetAllFilter } ) {
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
			group="typography"
			resetAllFilter={ attributesResetAllFilter }
		>
			{ children }
		</InspectorControls>
	);
}

export function TypographyPanel( {
	clientId,
	name,
	attributes,
	setAttributes,
	__unstableParentLayout,
} ) {
	const settings = useBlockSettings( name, __unstableParentLayout );
	const isEnabled = useHasTypographyPanel( settings );
	const value = useMemo( () => {
		return attributesToStyle( {
			style: attributes.style,
			fontFamily: attributes.fontFamily,
			fontSize: attributes.fontSize,
		} );
	}, [ attributes.style, attributes.fontSize, attributes.fontFamily ] );

	const onChange = ( newStyle ) => {
		setAttributes( styleToAttributes( newStyle ) );
	};

	if ( ! isEnabled ) {
		return null;
	}

	const defaultControls = getBlockSupport( name, [
		TYPOGRAPHY_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	return (
		<StylesTypographyPanel
			as={ TypographyInspectorControl }
			panelId={ clientId }
			settings={ settings }
			value={ value }
			onChange={ onChange }
			defaultControls={ defaultControls }
		/>
	);
}

export const hasTypographySupport = ( blockName ) => {
	return TYPOGRAPHY_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);
};

/**
 * Filters registered block settings to extend the block edit wrapper
 * to apply the desired classnames properly.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addEditProps( settings ) {
	if ( ! hasWritingModeSupport( settings ) ) {
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
 * Override props assigned to save component to inject typography classnames.
 *
 * @param {Object} props      Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( props, blockType, attributes ) {
	if (
		! hasWritingModeSupport( blockType ) ||
		shouldSkipSerialization( blockType, WRITING_MODE_SUPPORT_KEY )
	) {
		return props;
	}

	const { style } = attributes;
	const writingMode = style?.typography?.writingMode;
	const newClassName = classnames( props.className, {
		'has-writing-mode': writingMode ? true : false,
		'is-vertical-lr': writingMode === 'vertical-lr' ? true : false,
		'is-vertical-rl': writingMode === 'vertical-rl' ? true : false,
		'is-horizontal-tb': writingMode === 'horizontal-tb' ? true : false,
	} );
	props.className = newClassName ? newClassName : undefined;

	return props;
}

addFilter(
	'blocks.getSaveContent.extraProps',
	'core/typography/addSaveProps',
	addSaveProps
);

addFilter(
	'blocks.registerBlockType',
	'core/typography/addEditProps',
	addEditProps
);
