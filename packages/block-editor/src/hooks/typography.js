/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import { cleanEmptyObject } from './utils';

import {
	LINE_HEIGHT_SUPPORT_KEY,
	LineHeightEdit,
	hasLineHeightValue,
	resetLineHeight,
	useIsLineHeightDisabled,
} from './line-height';
import {
	FONT_STYLE_SUPPORT_KEY,
	FONT_WEIGHT_SUPPORT_KEY,
	FontAppearanceEdit,
	hasFontAppearanceValue,
	resetFontAppearance,
	useIsFontAppearanceDisabled,
} from './font-appearance';
import {
	FONT_FAMILY_SUPPORT_KEY,
	FontFamilyEdit,
	hasFontFamilyValue,
	resetFontFamily,
	useIsFontFamilyDisabled,
} from './font-family';
import {
	FONT_SIZE_SUPPORT_KEY,
	FontSizeEdit,
	hasFontSizeValue,
	resetFontSize,
	useIsFontSizeDisabled,
} from './font-size';
import {
	TEXT_DECORATION_SUPPORT_KEY,
	TextDecorationEdit,
	hasTextDecorationValue,
	resetTextDecoration,
	useIsTextDecorationDisabled,
} from './text-decoration';
import {
	TEXT_TRANSFORM_SUPPORT_KEY,
	TextTransformEdit,
	hasTextTransformValue,
	resetTextTransform,
	useIsTextTransformDisabled,
} from './text-transform';
import {
	LETTER_SPACING_SUPPORT_KEY,
	LetterSpacingEdit,
	hasLetterSpacingValue,
	resetLetterSpacing,
	useIsLetterSpacingDisabled,
} from './letter-spacing';

export const TYPOGRAPHY_SUPPORT_KEY = 'typography';
export const TYPOGRAPHY_SUPPORT_KEYS = [
	LINE_HEIGHT_SUPPORT_KEY,
	FONT_SIZE_SUPPORT_KEY,
	FONT_STYLE_SUPPORT_KEY,
	FONT_WEIGHT_SUPPORT_KEY,
	FONT_FAMILY_SUPPORT_KEY,
	TEXT_DECORATION_SUPPORT_KEY,
	TEXT_TRANSFORM_SUPPORT_KEY,
	LETTER_SPACING_SUPPORT_KEY,
];

export function TypographyPanel( props ) {
	const isFontFamilyDisabled = useIsFontFamilyDisabled( props );
	const isFontSizeDisabled = useIsFontSizeDisabled( props );
	const isFontAppearanceDisabled = useIsFontAppearanceDisabled( props );
	const isLineHeightDisabled = useIsLineHeightDisabled( props );
	const isTextDecorationDisabled = useIsTextDecorationDisabled( props );
	const isTextTransformDisabled = useIsTextTransformDisabled( props );
	const isLetterSpacingDisabled = useIsLetterSpacingDisabled( props );

	const isDisabled = useIsTypographyDisabled( props );
	const isSupported = hasTypographySupport( props.name );

	if ( isDisabled || ! isSupported ) return null;

	const defaultControls = getBlockSupport( props.name, [
		TYPOGRAPHY_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	// Callback to reset all block support attributes controlled via this panel.
	const resetAll = () => {
		const { style } = props.attributes;

		props.setAttributes( {
			fontSize: undefined,
			style: cleanEmptyObject( {
				...style,
				typography: undefined,
			} ),
		} );
	};

	return (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Typography options' ) }
				header={ __( 'Typography' ) }
				resetAll={ resetAll }
				className="typography-controls"
			>
				{ ! isFontFamilyDisabled && (
					<ToolsPanelItem
						hasValue={ () => hasFontFamilyValue( props ) }
						label={ __( 'Font family' ) }
						onDeselect={ () => resetFontFamily( props ) }
						isShownByDefault={ defaultControls?.fontFamily }
					>
						<FontFamilyEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ ! isFontSizeDisabled && (
					<ToolsPanelItem
						hasValue={ () => hasFontSizeValue( props ) }
						label={ __( 'Font size' ) }
						onDeselect={ () => resetFontSize( props ) }
						isShownByDefault={ defaultControls?.fontSize }
					>
						<FontSizeEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ ! isFontAppearanceDisabled && (
					<ToolsPanelItem
						className="single-column"
						hasValue={ () => hasFontAppearanceValue( props ) }
						label={ __( 'Appearance' ) }
						onDeselect={ () => resetFontAppearance( props ) }
						isShownByDefault={ defaultControls?.fontAppearance }
					>
						<FontAppearanceEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ ! isLineHeightDisabled && (
					<ToolsPanelItem
						className="single-column"
						hasValue={ () => hasLineHeightValue( props ) }
						label={ __( 'Line height' ) }
						onDeselect={ () => resetLineHeight( props ) }
						isShownByDefault={ defaultControls?.lineHeight }
					>
						<LineHeightEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ ! isTextDecorationDisabled && (
					<ToolsPanelItem
						className="single-column"
						hasValue={ () => hasTextDecorationValue( props ) }
						label={ __( 'Decoration' ) }
						onDeselect={ () => resetTextDecoration( props ) }
						isShownByDefault={ defaultControls?.textDecoration }
					>
						<TextDecorationEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ ! isTextTransformDisabled && (
					<ToolsPanelItem
						className="single-column"
						hasValue={ () => hasTextTransformValue( props ) }
						label={ __( 'Letter case' ) }
						onDeselect={ () => resetTextTransform( props ) }
						isShownByDefault={ defaultControls?.textTransform }
					>
						<TextTransformEdit { ...props } />
					</ToolsPanelItem>
				) }
				{ ! isLetterSpacingDisabled && (
					<ToolsPanelItem
						hasValue={ () => hasLetterSpacingValue( props ) }
						label={ __( 'Letter-spacing' ) }
						onDeselect={ () => resetLetterSpacing( props ) }
						isShownByDefault={ defaultControls?.letterSpacing }
					>
						<LetterSpacingEdit { ...props } />
					</ToolsPanelItem>
				) }
			</ToolsPanel>
		</InspectorControls>
	);
}

const hasTypographySupport = ( blockName ) => {
	return TYPOGRAPHY_SUPPORT_KEYS.some( ( key ) =>
		hasBlockSupport( blockName, key )
	);
};

function useIsTypographyDisabled( props = {} ) {
	const configs = [
		useIsFontAppearanceDisabled( props ),
		useIsFontSizeDisabled( props ),
		useIsLineHeightDisabled( props ),
		useIsFontFamilyDisabled( props ),
		useIsTextDecorationDisabled( props ),
		useIsTextTransformDisabled( props ),
		useIsLetterSpacingDisabled( props ),
	];

	return configs.filter( Boolean ).length === configs.length;
}
