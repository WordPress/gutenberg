/**
 * WordPress dependencies
 */
import {
	FontSizePicker,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontFamilyControl from '../font-family';
import FontAppearanceControl from '../font-appearance-control';
import LineHeightControl from '../line-height-control';
import LetterSpacingControl from '../letter-spacing-control';
import TextTransformControl from '../text-transform-control';
import TextDecorationControl from '../text-decoration-control';
import { getValueFromVariable } from './utils';
import { immutableSet } from '../../utils/object';

const MIN_TEXT_COLUMNS = 1;
const MAX_TEXT_COLUMNS = 6;

export function useHasTypographyPanel( settings ) {
	const hasFontFamily = useHasFontFamilyControl( settings );
	const hasLineHeight = useHasLineHeightControl( settings );
	const hasFontAppearance = useHasAppearanceControl( settings );
	const hasLetterSpacing = useHasLetterSpacingControl( settings );
	const hasTextTransform = useHasTextTransformControl( settings );
	const hasTextDecoration = useHasTextDecorationControl( settings );
	const hasTextColumns = useHasTextColumnsControl( settings );
	const hasFontSize = useHasFontSizeControl( settings );

	return (
		hasFontFamily ||
		hasLineHeight ||
		hasFontAppearance ||
		hasLetterSpacing ||
		hasTextTransform ||
		hasFontSize ||
		hasTextDecoration ||
		hasTextColumns
	);
}

function useHasFontSizeControl( settings ) {
	const disableCustomFontSizes = ! settings?.typography?.customFontSize;
	const fontSizesPerOrigin = settings?.typography?.fontSizes ?? {};
	const fontSizes =
		fontSizesPerOrigin?.custom ??
		fontSizesPerOrigin?.theme ??
		fontSizesPerOrigin.default;
	return !! fontSizes?.length || ! disableCustomFontSizes;
}

function useHasFontFamilyControl( settings ) {
	const fontFamiliesPerOrigin = settings?.typography?.fontFamilies;
	const fontFamilies =
		fontFamiliesPerOrigin?.custom ??
		fontFamiliesPerOrigin?.theme ??
		fontFamiliesPerOrigin?.default;
	return !! fontFamilies?.length;
}

function useHasLineHeightControl( settings ) {
	return settings?.typography?.lineHeight;
}

function useHasAppearanceControl( settings ) {
	const hasFontStyles = settings?.typography?.fontStyle;
	const hasFontWeights = settings?.typography?.fontWeight;
	return hasFontStyles || hasFontWeights;
}

function useAppearanceControlLabel( settings ) {
	const hasFontStyles = settings?.typography?.fontStyle;
	const hasFontWeights = settings?.typography?.fontWeight;
	if ( ! hasFontStyles ) {
		return __( 'Font weight' );
	}
	if ( ! hasFontWeights ) {
		return __( 'Font style' );
	}
	return __( 'Appearance' );
}

function useHasLetterSpacingControl( settings ) {
	return settings?.typography?.letterSpacing;
}

function useHasTextTransformControl( settings ) {
	return settings?.typography?.textTransform;
}

function useHasTextDecorationControl( settings ) {
	return settings?.typography?.textDecoration;
}

function useHasTextColumnsControl( settings ) {
	return settings?.typography?.textColumns;
}

function TypographyToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<ToolsPanel
			label={ __( 'Typography' ) }
			resetAll={ resetAll }
			panelId={ panelId }
		>
			{ children }
		</ToolsPanel>
	);
}

const DEFAULT_CONTROLS = {
	fontFamily: true,
	fontSize: true,
	fontAppearance: true,
	lineHeight: true,
	letterSpacing: true,
	textTransform: true,
	textDecoration: true,
	textColumns: true,
};

export default function TypographyPanel( {
	as: Wrapper = TypographyToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
} ) {
	const decodeValue = ( rawValue ) =>
		getValueFromVariable( { settings }, '', rawValue );

	// Font Family
	const hasFontFamilyEnabled = useHasFontFamilyControl( settings );
	const fontFamiliesPerOrigin = settings?.typography?.fontFamilies;
	const fontFamilies =
		fontFamiliesPerOrigin?.custom ??
		fontFamiliesPerOrigin?.theme ??
		fontFamiliesPerOrigin?.default;
	const fontFamily = decodeValue( inheritedValue?.typography?.fontFamily );
	const setFontFamily = ( newValue ) => {
		const slug = fontFamilies?.find(
			( { fontFamily: f } ) => f === newValue
		)?.slug;
		onChange(
			immutableSet(
				value,
				[ 'typography', 'fontFamily' ],
				slug ? `var:preset|font-family|${ slug }` : newValue
			)
		);
	};
	const hasFontFamily = () => !! value?.typography?.fontFamily;
	const resetFontFamily = () => setFontFamily( undefined );

	// Font Size
	const hasFontSizeEnabled = useHasFontSizeControl( settings );
	const disableCustomFontSizes = ! settings?.typography?.customFontSize;
	const fontSizesPerOrigin = settings?.typography?.fontSizes ?? {};
	const fontSizes =
		fontSizesPerOrigin?.custom ??
		fontSizesPerOrigin?.theme ??
		fontSizesPerOrigin.default;
	const fontSize = decodeValue( inheritedValue?.typography?.fontSize );
	const setFontSize = ( newValue, metadata ) => {
		const actualValue = !! metadata?.slug
			? `var:preset|font-size|${ metadata?.slug }`
			: newValue;

		onChange(
			immutableSet( value, [ 'typography', 'fontSize' ], actualValue )
		);
	};
	const hasFontSize = () => !! value?.typography?.fontSize;
	const resetFontSize = () => setFontSize( undefined );

	// Appearance
	const hasAppearanceControl = useHasAppearanceControl( settings );
	const appearanceControlLabel = useAppearanceControlLabel( settings );
	const hasFontStyles = settings?.typography?.fontStyle;
	const hasFontWeights = settings?.typography?.fontWeight;
	const fontStyle = decodeValue( inheritedValue?.typography?.fontStyle );
	const fontWeight = decodeValue( inheritedValue?.typography?.fontWeight );
	const setFontAppearance = ( {
		fontStyle: newFontStyle,
		fontWeight: newFontWeight,
	} ) => {
		onChange( {
			...value,
			typography: {
				...value?.typography,
				fontStyle: newFontStyle,
				fontWeight: newFontWeight,
			},
		} );
	};
	const hasFontAppearance = () =>
		!! value?.typography?.fontStyle || !! value?.typography?.fontWeight;
	const resetFontAppearance = () => {
		setFontAppearance( {} );
	};

	// Line Height
	const hasLineHeightEnabled = useHasLineHeightControl( settings );
	const lineHeight = decodeValue( inheritedValue?.typography?.lineHeight );
	const setLineHeight = ( newValue ) => {
		onChange(
			immutableSet( value, [ 'typography', 'lineHeight' ], newValue )
		);
	};
	const hasLineHeight = () => !! value?.typography?.lineHeight;
	const resetLineHeight = () => setLineHeight( undefined );

	// Letter Spacing
	const hasLetterSpacingControl = useHasLetterSpacingControl( settings );
	const letterSpacing = decodeValue(
		inheritedValue?.typography?.letterSpacing
	);
	const setLetterSpacing = ( newValue ) => {
		onChange(
			immutableSet( value, [ 'typography', 'letterSpacing' ], newValue )
		);
	};
	const hasLetterSpacing = () => !! value?.typography?.letterSpacing;
	const resetLetterSpacing = () => setLetterSpacing( undefined );

	// Text Columns
	const hasTextColumnsControl = useHasTextColumnsControl( settings );
	const textColumns = decodeValue( inheritedValue?.typography?.textColumns );
	const setTextColumns = ( newValue ) => {
		onChange(
			immutableSet( value, [ 'typography', 'textColumns' ], newValue )
		);
	};
	const hasTextColumns = () => !! value?.typography?.textColumns;
	const resetTextColumns = () => setTextColumns( undefined );

	// Text Transform
	const hasTextTransformControl = useHasTextTransformControl( settings );
	const textTransform = decodeValue(
		inheritedValue?.typography?.textTransform
	);
	const setTextTransform = ( newValue ) => {
		onChange(
			immutableSet( value, [ 'typography', 'textTransform' ], newValue )
		);
	};
	const hasTextTransform = () => !! value?.typography?.textTransform;
	const resetTextTransform = () => setTextTransform( undefined );

	// Text Decoration
	const hasTextDecorationControl = useHasTextDecorationControl( settings );
	const textDecoration = decodeValue(
		inheritedValue?.typography?.textDecoration
	);
	const setTextDecoration = ( newValue ) => {
		onChange(
			immutableSet( value, [ 'typography', 'textDecoration' ], newValue )
		);
	};
	const hasTextDecoration = () => !! value?.typography?.textDecoration;
	const resetTextDecoration = () => setTextDecoration( undefined );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			typography: {},
		};
	}, [] );

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			{ hasFontFamilyEnabled && (
				<ToolsPanelItem
					label={ __( 'Font family' ) }
					hasValue={ hasFontFamily }
					onDeselect={ resetFontFamily }
					isShownByDefault={ defaultControls.fontFamily }
					panelId={ panelId }
				>
					<FontFamilyControl
						fontFamilies={ fontFamilies }
						value={ fontFamily }
						onChange={ setFontFamily }
						size="__unstable-large"
						__nextHasNoMarginBottom
					/>
				</ToolsPanelItem>
			) }
			{ hasFontSizeEnabled && (
				<ToolsPanelItem
					label={ __( 'Font size' ) }
					hasValue={ hasFontSize }
					onDeselect={ resetFontSize }
					isShownByDefault={ defaultControls.fontSize }
					panelId={ panelId }
				>
					<FontSizePicker
						value={ fontSize }
						onChange={ setFontSize }
						fontSizes={ fontSizes }
						disableCustomFontSizes={ disableCustomFontSizes }
						withReset={ false }
						withSlider
						size="__unstable-large"
						__nextHasNoMarginBottom
					/>
				</ToolsPanelItem>
			) }
			{ hasAppearanceControl && (
				<ToolsPanelItem
					className="single-column"
					label={ appearanceControlLabel }
					hasValue={ hasFontAppearance }
					onDeselect={ resetFontAppearance }
					isShownByDefault={ defaultControls.fontAppearance }
					panelId={ panelId }
				>
					<FontAppearanceControl
						value={ {
							fontStyle,
							fontWeight,
						} }
						onChange={ setFontAppearance }
						hasFontStyles={ hasFontStyles }
						hasFontWeights={ hasFontWeights }
						size="__unstable-large"
						__nextHasNoMarginBottom
					/>
				</ToolsPanelItem>
			) }
			{ hasLineHeightEnabled && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Line height' ) }
					hasValue={ hasLineHeight }
					onDeselect={ resetLineHeight }
					isShownByDefault={ defaultControls.lineHeight }
					panelId={ panelId }
				>
					<LineHeightControl
						__nextHasNoMarginBottom
						__unstableInputWidth="auto"
						value={ lineHeight }
						onChange={ setLineHeight }
						size="__unstable-large"
					/>
				</ToolsPanelItem>
			) }
			{ hasLetterSpacingControl && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Letter spacing' ) }
					hasValue={ hasLetterSpacing }
					onDeselect={ resetLetterSpacing }
					isShownByDefault={ defaultControls.letterSpacing }
					panelId={ panelId }
				>
					<LetterSpacingControl
						value={ letterSpacing }
						onChange={ setLetterSpacing }
						size="__unstable-large"
						__unstableInputWidth="auto"
					/>
				</ToolsPanelItem>
			) }
			{ hasTextColumnsControl && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Text columns' ) }
					hasValue={ hasTextColumns }
					onDeselect={ resetTextColumns }
					isShownByDefault={ defaultControls.textColumns }
					panelId={ panelId }
				>
					<NumberControl
						label={ __( 'Text columns' ) }
						max={ MAX_TEXT_COLUMNS }
						min={ MIN_TEXT_COLUMNS }
						onChange={ setTextColumns }
						size="__unstable-large"
						spinControls="custom"
						value={ textColumns }
						initialPosition={ 1 }
					/>
				</ToolsPanelItem>
			) }
			{ hasTextDecorationControl && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Text decoration' ) }
					hasValue={ hasTextDecoration }
					onDeselect={ resetTextDecoration }
					isShownByDefault={ defaultControls.textDecoration }
					panelId={ panelId }
				>
					<TextDecorationControl
						value={ textDecoration }
						onChange={ setTextDecoration }
						size="__unstable-large"
						__unstableInputWidth="auto"
					/>
				</ToolsPanelItem>
			) }
			{ hasTextTransformControl && (
				<ToolsPanelItem
					label={ __( 'Letter case' ) }
					hasValue={ hasTextTransform }
					onDeselect={ resetTextTransform }
					isShownByDefault={ defaultControls.textTransform }
					panelId={ panelId }
				>
					<TextTransformControl
						value={ textTransform }
						onChange={ setTextTransform }
						showNone
						isBlock
						size="__unstable-large"
						__nextHasNoMarginBottom
					/>
				</ToolsPanelItem>
			) }
		</Wrapper>
	);
}
