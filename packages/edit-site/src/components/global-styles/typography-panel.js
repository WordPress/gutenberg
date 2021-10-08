/**
 * WordPress dependencies
 */
import {
	LineHeightControl,
	__experimentalFontFamilyControl as FontFamilyControl,
	__experimentalFontAppearanceControl as FontAppearanceControl,
	__experimentalLetterSpacingControl as LetterSpacingControl,
	__experimentalTextDecorationControl as TextDecorationControl,
	__experimentalTextTransformControl as TextTransformControl,
} from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	FontSizePicker,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels, useSetting, useStyle } from './hooks';

export function useHasTypographyPanel( name ) {
	const hasLineHeight = useHasLineHeightControl( name );
	const hasFontAppearance = useHasAppearanceControl( name );
	const hasLetterSpacing = useHasLetterSpacingControl( name );
	const hasTextDecoration = useHasTextDecorationControl( name );
	const hasTextTransform = useHasTextTransformControl( name );
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		hasLineHeight ||
		hasFontAppearance ||
		hasLetterSpacing ||
		hasTextDecoration ||
		hasTextTransform ||
		supports.includes( 'fontSize' ) ||
		supports.includes( 'fontFamily' )
	);
}

function useHasLineHeightControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'typography.customLineHeight', name )[ 0 ] &&
		supports.includes( 'lineHeight' )
	);
}

function useHasAppearanceControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasFontStyles =
		useSetting( 'typography.customFontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useSetting( 'typography.customFontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );
	return hasFontStyles || hasFontWeights;
}

function useHasTextDecorationControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'typography.customTextDecoration', name )[ 0 ] &&
		supports.includes( 'textDecoration' )
	);
}

function useHasTextTransformControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'typography.customTextTransform', name )[ 0 ] &&
		supports.includes( 'textTransform' )
	);
}

function useHasLetterSpacingControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'typography.customLetterSpacing', name )[ 0 ] &&
		supports.includes( 'letterSpacing' )
	);
}

export default function TypographyPanel( { name } ) {
	const supports = getSupportedGlobalStylesPanels( name );

	// To better reflect if the user has customized a value we need to
	// ensure the style value being checked is from the `user` origin.
	const [ userTypographyStyles ] = useStyle( 'typography', name, 'user' );
	const createHasValueCallback = ( feature ) => () =>
		!! userTypographyStyles?.[ feature ]?.[ 0 ];

	// Font Family.
	const showFontFamilyControl = supports.includes( 'fontFamily' );
	const [ fontFamilies ] = useSetting( 'typography.fontFamilies', name );
	const [ fontFamily, setFontFamily ] = useStyle(
		'typography.fontFamily',
		name
	);

	// Font Size.
	const showFontSizeControl = supports.includes( 'fontSize' );
	const [ fontSizes ] = useSetting( 'typography.fontSizes', name );
	const [ fontSize, setFontSize ] = useStyle( 'typography.fontSize', name );
	const disableCustomFontSizes = ! useSetting(
		'typography.customFontSize',
		name
	)[ 0 ];

	// Font Appearance - Includes both font style and weight.
	const showAppearanceControl = useHasAppearanceControl( name );
	const [ fontStyle, setFontStyle ] = useStyle(
		'typography.fontStyle',
		name
	);
	const [ fontWeight, setFontWeight ] = useStyle(
		'typography.fontWeight',
		name
	);
	const hasFontAppearanceValue = () => !! fontStyle || !! fontWeight;
	const resetFontAppearance = () => {
		setFontStyle( undefined );
		setFontWeight( undefined );
	};

	const hasFontStyles =
		useSetting( 'typography.customFontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );

	const hasFontWeights =
		useSetting( 'typography.customFontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );

	// Line Height.
	const showLineHeightControl = useHasLineHeightControl( name );
	const [ lineHeight, setLineHeight ] = useStyle(
		'typography.lineHeight',
		name
	);

	// Text Decoration.
	const showTextDecoration = useHasTextDecorationControl( name );
	const [ textDecoration, setTextDecoration ] = useStyle(
		'typography.textDecoration',
		name
	);

	// Text Transform.
	const showTextTransform = useHasTextTransformControl( name );
	const [ textTransform, setTextTransform ] = useStyle(
		'typography.textTransform',
		name
	);

	// Letter Spacing.
	const showLetterSpacingControl = useHasLetterSpacingControl( name );
	const [ letterSpacing, setLetterSpacing ] = useStyle(
		'typography.letterSpacing',
		name
	);

	// Reset all the typography related global styles.
	const resetAll = () => {
		setFontFamily( name, 'fontFamily', undefined );
		setFontSize( name, 'fontSize', undefined );
		setFontStyle( name, 'fontStyle', undefined );
		setFontWeight( name, 'fontWeight', undefined );
		setLineHeight( name, 'lineHeight', undefined );
		setTextDecoration( name, 'textDecoration', undefined );
		setTextTransform( name, 'textTransform', undefined );
		setLetterSpacing( name, 'letterSpacing', undefined );
	};

	return (
		<ToolsPanel label={ __( 'Typography' ) } resetAll={ resetAll }>
			{ showFontFamilyControl && (
				<ToolsPanelItem
					hasValue={ createHasValueCallback( 'fontFamily' ) }
					label={ __( 'Font family' ) }
					onDeselect={ () => setFontFamily( undefined ) }
					isShownByDefault={ true }
				>
					<FontFamilyControl
						fontFamilies={ fontFamilies }
						value={ fontFamily }
						onChange={ setFontFamily }
					/>
				</ToolsPanelItem>
			) }
			{ showFontSizeControl && (
				<ToolsPanelItem
					hasValue={ createHasValueCallback( 'fontSize' ) }
					label={ __( 'Font size' ) }
					onDeselect={ () => setFontSize( undefined ) }
					isShownByDefault={ true }
				>
					<FontSizePicker
						value={ fontSize }
						onChange={ setFontSize }
						fontSizes={ fontSizes }
						disableCustomFontSizes={ disableCustomFontSizes }
					/>
				</ToolsPanelItem>
			) }
			{ showAppearanceControl && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ hasFontAppearanceValue }
					label={ __( 'Appearance' ) }
					onDeselect={ resetFontAppearance }
					isShownByDefault={ true }
				>
					<FontAppearanceControl
						value={ { fontStyle, fontWeight } }
						onChange={ ( {
							fontStyle: newFontStyle,
							fontWeight: newFontWeight,
						} ) => {
							setFontStyle( newFontStyle );
							setFontWeight( newFontWeight );
						} }
						hasFontStyles={ hasFontStyles }
						hasFontWeights={ hasFontWeights }
					/>
				</ToolsPanelItem>
			) }
			{ showLineHeightControl && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ createHasValueCallback( 'lineHeight' ) }
					label={ __( 'Line height' ) }
					onDeselect={ () => setLineHeight( undefined ) }
					isShownByDefault={ true }
				>
					<LineHeightControl
						value={ lineHeight }
						onChange={ setLineHeight }
					/>
				</ToolsPanelItem>
			) }
			{ showTextDecoration && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ createHasValueCallback( 'textDecoration' ) }
					label={ __( 'Decoration' ) }
					onDeselect={ () => setTextDecoration( undefined ) }
					isShownByDefault={ true }
				>
					<TextDecorationControl
						value={ textDecoration }
						onChange={ setTextDecoration }
					/>
				</ToolsPanelItem>
			) }
			{ showTextTransform && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ createHasValueCallback( 'textTransform' ) }
					label={ __( 'Letter case' ) }
					onDeselect={ () => setTextTransform( undefined ) }
					isShownByDefault={ true }
				>
					<TextTransformControl
						value={ textTransform }
						onChange={ setTextTransform }
					/>
				</ToolsPanelItem>
			) }
			{ showLetterSpacingControl && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ createHasValueCallback( 'letterSpacing' ) }
					label={ __( 'Letter-spacing' ) }
					onDeselect={ () => setLetterSpacing( undefined ) }
					isShownByDefault={ true }
				>
					<LetterSpacingControl
						value={ letterSpacing }
						onChange={ setLetterSpacing }
					/>
				</ToolsPanelItem>
			) }
		</ToolsPanel>
	);
}
