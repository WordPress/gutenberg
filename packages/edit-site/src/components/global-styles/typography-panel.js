/**
 * WordPress dependencies
 */
import {
	LineHeightControl,
	__experimentalFontFamilyControl as FontFamilyControl,
	__experimentalFontAppearanceControl as FontAppearanceControl,
	__experimentalLetterSpacingControl as LetterSpacingControl,
	__experimentalTextTransformControl as TextTransformControl,
	__experimentalTextDecorationControl as TextDecorationControl,
	experiments as blockEditorExperiments,
} from '@wordpress/block-editor';
import {
	FontSizePicker,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSupportedStyles } from './hooks';
import { unlock } from '../../experiments';

const { useGlobalSetting, useGlobalStyle } = unlock( blockEditorExperiments );

export function useHasTypographyPanel( name ) {
	const hasFontFamily = useHasFontFamilyControl( name );
	const hasLineHeight = useHasLineHeightControl( name );
	const hasFontAppearance = useHasAppearanceControl( name );
	const hasLetterSpacing = useHasLetterSpacingControl( name );
	const supports = useSupportedStyles( name );
	return (
		hasFontFamily ||
		hasLineHeight ||
		hasFontAppearance ||
		hasLetterSpacing ||
		supports.includes( 'fontSize' )
	);
}

function useHasFontFamilyControl( name ) {
	const supports = useSupportedStyles( name );
	const [ fontFamiliesPerOrigin ] = useGlobalSetting(
		'typography.fontFamilies',
		name
	);
	const fontFamilies =
		fontFamiliesPerOrigin?.custom ||
		fontFamiliesPerOrigin?.theme ||
		fontFamiliesPerOrigin?.default;
	return supports.includes( 'fontFamily' ) && !! fontFamilies?.length;
}

function useHasLineHeightControl( name ) {
	const supports = useSupportedStyles( name );
	return (
		useGlobalSetting( 'typography.lineHeight', name )[ 0 ] &&
		supports.includes( 'lineHeight' )
	);
}

function useHasAppearanceControl( name ) {
	const supports = useSupportedStyles( name );
	const hasFontStyles =
		useGlobalSetting( 'typography.fontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useGlobalSetting( 'typography.fontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );
	return hasFontStyles || hasFontWeights;
}

function useAppearanceControlLabel( name ) {
	const supports = useSupportedStyles( name );
	const hasFontStyles =
		useGlobalSetting( 'typography.fontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useGlobalSetting( 'typography.fontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );
	if ( ! hasFontStyles ) {
		return __( 'Font weight' );
	}
	if ( ! hasFontWeights ) {
		return __( 'Font style' );
	}
	return __( 'Appearance' );
}

function useHasLetterSpacingControl( name, element ) {
	const supports = useSupportedStyles( name, element );
	return (
		useGlobalSetting( 'typography.letterSpacing', name )[ 0 ] &&
		supports.includes( 'letterSpacing' )
	);
}

function useHasTextTransformControl( name, element ) {
	const supports = useSupportedStyles( name, element );
	return (
		useGlobalSetting( 'typography.textTransform', name )[ 0 ] &&
		supports.includes( 'textTransform' )
	);
}

function useHasTextDecorationControl( name, element ) {
	// This is an exception for link elements.
	// We shouldn't allow other blocks or elements to set textDecoration
	// because this will be inherited by their children.
	return ! name && element === 'link';
}

function useStyleWithReset( path, blockName ) {
	const [ style, setStyle ] = useGlobalStyle( path, blockName );
	const [ userStyle ] = useGlobalStyle( path, blockName, 'user' );
	const hasStyle = () => !! userStyle;
	const resetStyle = () => setStyle( undefined );
	return [ style, setStyle, hasStyle, resetStyle ];
}

function useFontSizeWithReset( path, blockName ) {
	const [ fontSize, setStyleCallback ] = useGlobalStyle( path, blockName );
	const [ userStyle ] = useGlobalStyle( path, blockName, 'user' );
	const hasFontSize = () => !! userStyle;
	const resetFontSize = () => setStyleCallback( undefined );
	const setFontSize = ( newValue, metadata ) => {
		if ( !! metadata?.slug ) {
			newValue = `var:preset|font-size|${ metadata?.slug }`;
		}
		setStyleCallback( newValue );
	};

	return {
		fontSize,
		setFontSize,
		hasFontSize,
		resetFontSize,
	};
}

function useFontAppearance( prefix, name ) {
	const [ fontStyle, setFontStyle ] = useGlobalStyle(
		prefix + 'typography.fontStyle',
		name
	);
	const [ userFontStyle ] = useGlobalStyle(
		prefix + 'typography.fontStyle',
		name,
		'user'
	);
	const [ fontWeight, setFontWeight ] = useGlobalStyle(
		prefix + 'typography.fontWeight',
		name
	);
	const [ userFontWeight ] = useGlobalStyle(
		prefix + 'typography.fontWeight',
		name,
		'user'
	);
	const hasFontAppearance = () => !! userFontStyle || !! userFontWeight;
	const resetFontAppearance = () => {
		setFontStyle( undefined );
		setFontWeight( undefined );
	};
	return {
		fontStyle,
		setFontStyle,
		fontWeight,
		setFontWeight,
		hasFontAppearance,
		resetFontAppearance,
	};
}

export default function TypographyPanel( {
	name,
	element,
	headingLevel,
	variation = '',
} ) {
	const supports = useSupportedStyles( name );
	let prefix = '';
	if ( element === 'heading' ) {
		prefix = `elements.${ headingLevel }.`;
	} else if ( element && element !== 'text' ) {
		prefix = `elements.${ element }.`;
	}
	if ( variation ) {
		prefix = prefix
			? `variations.${ variation }.${ prefix }`
			: `variations.${ variation }`;
	}
	const [ fontSizesPerOrigin ] = useGlobalSetting(
		'typography.fontSizes',
		name
	);
	const fontSizes =
		fontSizesPerOrigin?.custom ||
		fontSizesPerOrigin?.theme ||
		fontSizesPerOrigin?.default;

	const disableCustomFontSizes = ! useGlobalSetting(
		'typography.customFontSize',
		name
	)[ 0 ];
	const [ fontFamiliesPerOrigin ] = useGlobalSetting(
		'typography.fontFamilies',
		name
	);
	const fontFamilies =
		fontFamiliesPerOrigin?.custom ||
		fontFamiliesPerOrigin?.theme ||
		fontFamiliesPerOrigin?.default;
	const hasFontStyles =
		useGlobalSetting( 'typography.fontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useGlobalSetting( 'typography.fontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );
	const hasFontFamilyEnabled = useHasFontFamilyControl( name );
	const hasLineHeightEnabled = useHasLineHeightControl( name );
	const hasAppearanceControl = useHasAppearanceControl( name );
	const appearanceControlLabel = useAppearanceControlLabel( name );
	const hasLetterSpacingControl = useHasLetterSpacingControl( name, element );
	const hasTextTransformControl = useHasTextTransformControl( name, element );
	const hasTextDecorationControl = useHasTextDecorationControl(
		name,
		element
	);

	/* Disable font size controls when the option to style all headings is selected. */
	let hasFontSizeEnabled = supports.includes( 'fontSize' );
	if ( element === 'heading' && headingLevel === 'heading' ) {
		hasFontSizeEnabled = false;
	}

	const [ fontFamily, setFontFamily, hasFontFamily, resetFontFamily ] =
		useStyleWithReset( prefix + 'typography.fontFamily', name );
	const { fontSize, setFontSize, hasFontSize, resetFontSize } =
		useFontSizeWithReset( prefix + 'typography.fontSize', name );
	const {
		fontStyle,
		setFontStyle,
		fontWeight,
		setFontWeight,
		hasFontAppearance,
		resetFontAppearance,
	} = useFontAppearance( prefix, name );
	const [ lineHeight, setLineHeight, hasLineHeight, resetLineHeight ] =
		useStyleWithReset( prefix + 'typography.lineHeight', name );
	const [
		letterSpacing,
		setLetterSpacing,
		hasLetterSpacing,
		resetLetterSpacing,
	] = useStyleWithReset( prefix + 'typography.letterSpacing', name );
	const [
		textTransform,
		setTextTransform,
		hasTextTransform,
		resetTextTransform,
	] = useStyleWithReset( prefix + 'typography.textTransform', name );
	const [
		textDecoration,
		setTextDecoration,
		hasTextDecoration,
		resetTextDecoration,
	] = useStyleWithReset( prefix + 'typography.textDecoration', name );

	const resetAll = () => {
		resetFontFamily();
		resetFontSize();
		resetFontAppearance();
		resetLineHeight();
		resetLetterSpacing();
		resetTextTransform();
	};

	return (
		<ToolsPanel label={ __( 'Typography' ) } resetAll={ resetAll }>
			{ hasFontFamilyEnabled && (
				<ToolsPanelItem
					label={ __( 'Font family' ) }
					hasValue={ hasFontFamily }
					onDeselect={ resetFontFamily }
					isShownByDefault
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
					isShownByDefault
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
					isShownByDefault
				>
					<FontAppearanceControl
						value={ {
							fontStyle,
							fontWeight,
						} }
						onChange={ ( {
							fontStyle: newFontStyle,
							fontWeight: newFontWeight,
						} ) => {
							setFontStyle( newFontStyle );
							setFontWeight( newFontWeight );
						} }
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
					isShownByDefault
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
					isShownByDefault
				>
					<LetterSpacingControl
						value={ letterSpacing }
						onChange={ setLetterSpacing }
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
					isShownByDefault
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
			{ hasTextDecorationControl && (
				<ToolsPanelItem
					className="single-column"
					label={ __( 'Text decoration' ) }
					hasValue={ hasTextDecoration }
					onDeselect={ resetTextDecoration }
					isShownByDefault
				>
					<TextDecorationControl
						value={ textDecoration }
						onChange={ setTextDecoration }
						size="__unstable-large"
						__unstableInputWidth="auto"
					/>
				</ToolsPanelItem>
			) }
		</ToolsPanel>
	);
}
