/**
 * WordPress dependencies
 */
import {
	FontSizePicker,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import FontFamilyControl from '../font-family';
import FontAppearanceControl from '../font-appearance-control';
import LineHeightControl from '../line-height-control';
import LetterSpacingControl from '../letter-spacing-control';
import TextTransformControl from '../text-transform-control';
import TextDecorationControl from '../text-decoration-control';
import { useGlobalSetting, useSupportedStyles } from './hooks';

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
	const [ fontFamilies ] = useGlobalSetting(
		'typography.fontFamilies',
		name
	);
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
	const setting = useGlobalSetting( 'typography.letterSpacing', name )[ 0 ];
	const supports = useSupportedStyles( name );
	if ( ! setting ) {
		return false;
	}
	if ( ! name && element === 'heading' ) {
		return true;
	}
	return supports.includes( 'letterSpacing' );
}

function useHasTextTransformControl( name, element ) {
	const setting = useGlobalSetting( 'typography.textTransform', name )[ 0 ];
	const supports = useSupportedStyles( name );
	if ( ! setting ) {
		return false;
	}
	if ( ! name && element === 'heading' ) {
		return true;
	}
	return supports.includes( 'textTransform' );
}

function useHasTextDecorationControl( name, element ) {
	// This is an exception for link elements.
	// We shouldn't allow other blocks or elements to set textDecoration
	// because this will be inherited by their children.
	return ! name && element === 'link';
}

export default function TypographyPanel( {
	name,
	element,
	value,
	onChange,
	inherit,
} ) {
	const supports = useSupportedStyles( name );

	// Font Family
	const hasFontFamilyEnabled = useHasFontFamilyControl( name );
	const [ fontFamilies ] = useGlobalSetting(
		'typography.fontFamilies',
		name
	);
	const fontFamily = inherit?.typography?.fontFamily;
	const setFontFamily = ( newValue ) => {
		onChange( {
			...value,
			typography: {
				...value?.typography,
				fontFamily: newValue,
			},
		} );
	};
	const hasFontFamily = () => !! value?.typography?.fontFamily;
	const resetFontFamily = () => setFontFamily( undefined );

	// Font Size
	/* Disable font size controls when the option to style all headings is selected. */
	const hasFontSizeEnabled =
		element === 'heading' ? false : supports.includes( 'fontSize' );
	const disableCustomFontSizes = ! useGlobalSetting(
		'typography.customFontSize',
		name
	)[ 0 ];
	const [ fontSizes ] = useGlobalSetting( 'typography.fontSizes', name );
	const fontSize = inherit?.typography?.fontSize;
	const setFontSize = ( newValue, metadata ) => {
		const actualValue = !! metadata?.slug
			? `var:preset|font-size|${ metadata?.slug }`
			: newValue;

		onChange( {
			...value,
			typography: {
				...value?.typography,
				fontSize: actualValue,
			},
		} );
	};
	const hasFontSize = () => !! value?.typography?.fontSize;
	const resetFontSize = () => setFontSize( undefined );

	// Appearance
	const hasAppearanceControl = useHasAppearanceControl( name );
	const appearanceControlLabel = useAppearanceControlLabel( name );
	const hasFontStyles =
		useGlobalSetting( 'typography.fontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useGlobalSetting( 'typography.fontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );
	const fontStyle = inherit?.typography?.fontStyle;
	const fontWeight = inherit?.typography?.fontWeight;
	const setFontStyle = ( newValue ) => {
		onChange( {
			...value,
			typography: {
				...value?.typography,
				fontStyle: newValue,
			},
		} );
	};
	const setFontWeight = ( newValue ) => {
		onChange( {
			...value,
			typography: {
				...value?.typography,
				fontWeight: newValue,
			},
		} );
	};
	const hasFontAppearance = () =>
		!! value?.typography?.fontStyle || !! value?.typography?.fontWeight;
	const resetFontAppearance = () => {
		setFontStyle( undefined );
		setFontWeight( undefined );
	};

	// Line Height
	const hasLineHeightEnabled = useHasLineHeightControl( name );
	const lineHeight = inherit?.typography?.lineHeight;
	const setLineHeight = ( newValue ) => {
		onChange( {
			...value,
			typography: {
				...value?.typography,
				lineHeight: newValue,
			},
		} );
	};
	const hasLineHeight = () => !! value?.typography?.lineHeight;
	const resetLineHeight = () => setLineHeight( undefined );

	// Letter Spacing
	const hasLetterSpacingControl = useHasLetterSpacingControl( name, element );
	const letterSpacing = inherit?.typography?.letterSpacing;
	const setLetterSpacing = ( newValue ) => {
		onChange( {
			...value,
			typography: {
				...value?.typography,
				letterSpacing: newValue,
			},
		} );
	};
	const hasLetterSpacing = () => !! value?.typography?.letterSpacing;
	const resetLetterSpacing = () => setLetterSpacing( undefined );

	// Text Transform
	const hasTextTransformControl = useHasTextTransformControl( name, element );
	const textTransform = inherit?.typography?.textTransform;
	const setTextTransform = ( newValue ) => {
		onChange( {
			...value,
			typography: {
				...value?.typography,
				textTransform: newValue,
			},
		} );
	};
	const hasTextTransform = () => !! value?.typography?.textTransform;
	const resetTextTransform = () => setTextTransform( undefined );

	// Text Decoration
	const hasTextDecorationControl = useHasTextDecorationControl(
		name,
		element
	);
	const textDecoration = inherit?.typography?.textDecoration;
	const setTextDecoration = ( newValue ) => {
		onChange( {
			...value,
			typography: {
				...value?.typography,
				textDecoration: newValue,
			},
		} );
	};
	const hasTextDecoration = () => !! value?.typography?.textDecoration;
	const resetTextDecoration = () => setTextDecoration( undefined );

	const resetAll = () => {
		resetFontFamily();
		setFontSize();
		resetFontAppearance();
		resetLineHeight();
		resetLetterSpacing();
		resetTextDecoration();
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
