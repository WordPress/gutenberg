/**
 * WordPress dependencies
 */
import { getBlockSupport, hasBlockSupport } from '@wordpress/blocks';
import { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InspectorControls from '../components/inspector-controls';
import { getFontAppearanceLabel } from '../components/font-appearance-control';

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
	useIsFontStyleDisabled,
	useIsFontWeightDisabled,
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
	const { clientId } = props;
	const isFontFamilyDisabled = useIsFontFamilyDisabled( props );
	const isFontSizeDisabled = useIsFontSizeDisabled( props );
	const isFontAppearanceDisabled = useIsFontAppearanceDisabled( props );
	const isLineHeightDisabled = useIsLineHeightDisabled( props );
	const isTextDecorationDisabled = useIsTextDecorationDisabled( props );
	const isTextTransformDisabled = useIsTextTransformDisabled( props );
	const isLetterSpacingDisabled = useIsLetterSpacingDisabled( props );

	const hasFontStyles = ! useIsFontStyleDisabled( props );
	const hasFontWeights = ! useIsFontWeightDisabled( props );

	const isDisabled = useIsTypographyDisabled( props );
	const isSupported = hasTypographySupport( props.name );

	if ( isDisabled || ! isSupported ) return null;

	const defaultControls = getDefaultTypographyControls( props.name );

	const createResetAllFilter = ( attribute ) => ( newAttributes ) => ( {
		...newAttributes,
		style: {
			...newAttributes.style,
			typography: {
				...newAttributes.style?.typography,
				[ attribute ]: undefined,
			},
		},
	} );

	return (
		<InspectorControls __experimentalGroup="typography">
			{ ! isFontFamilyDisabled && (
				<ToolsPanelItem
					hasValue={ () => hasFontFamilyValue( props ) }
					label={ __( 'Font family' ) }
					onDeselect={ () => resetFontFamily( props ) }
					isShownByDefault={ defaultControls?.fontFamily }
					resetAllFilter={ ( newAttributes ) => ( {
						...newAttributes,
						fontFamily: undefined,
					} ) }
					panelId={ clientId }
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
					resetAllFilter={ ( newAttributes ) => ( {
						...newAttributes,
						fontSize: undefined,
						style: {
							...newAttributes.style,
							typography: {
								...newAttributes.style?.typography,
								fontSize: undefined,
							},
						},
					} ) }
					panelId={ clientId }
				>
					<FontSizeEdit { ...props } />
				</ToolsPanelItem>
			) }
			{ ! isFontAppearanceDisabled && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ () => hasFontAppearanceValue( props ) }
					label={ getFontAppearanceLabel(
						hasFontStyles,
						hasFontWeights
					) }
					onDeselect={ () => resetFontAppearance( props ) }
					isShownByDefault={ defaultControls?.fontAppearance }
					resetAllFilter={ ( newAttributes ) => ( {
						...newAttributes,
						style: {
							...newAttributes.style,
							typography: {
								...newAttributes.style?.typography,
								fontStyle: undefined,
								fontWeight: undefined,
							},
						},
					} ) }
					panelId={ clientId }
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
					resetAllFilter={ createResetAllFilter( 'lineHeight' ) }
					panelId={ clientId }
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
					resetAllFilter={ createResetAllFilter( 'textDecoration' ) }
					panelId={ clientId }
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
					resetAllFilter={ createResetAllFilter( 'textTransform' ) }
					panelId={ clientId }
				>
					<TextTransformEdit { ...props } />
				</ToolsPanelItem>
			) }
			{ ! isLetterSpacingDisabled && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ () => hasLetterSpacingValue( props ) }
					label={ __( 'Letter spacing' ) }
					onDeselect={ () => resetLetterSpacing( props ) }
					isShownByDefault={ defaultControls?.letterSpacing }
					resetAllFilter={ createResetAllFilter( 'letterSpacing' ) }
					panelId={ clientId }
				>
					<LetterSpacingEdit { ...props } />
				</ToolsPanelItem>
			) }
		</InspectorControls>
	);
}

export const hasTypographySupport = ( blockName ) => {
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

/**
 * Returns an object containing default controls. A control key with a `true` value
 * means that the control will be shown in the panel by default.
 *
 * @param {string|Object} blockType Block name or block type object.
 *
 * @return {Object} Default controls key/value pairs.
 */
export function getDefaultTypographyControls( blockType ) {
	const defaultTypographyControls = getBlockSupport( blockType, [
		TYPOGRAPHY_SUPPORT_KEY,
		'__experimentalDefaultControls',
	] );

	if ( defaultBorderControls === 'all' ) {
		return {
			fontFamily: true,
			fontSize: true,
			fontAppearance: true,
			lineHeight: true,
			textDecoration: true,
			letterSpacing: true,
		};
	}

	return defaultBorderControls;
}
