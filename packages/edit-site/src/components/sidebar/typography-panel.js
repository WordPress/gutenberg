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
import { useSetting } from '../editor/utils';

export function useHasTypographyPanel( { supports, name } ) {
	const hasLineHeight = useHasLineHeightControl( { supports, name } );
	const hasFontAppearance = useHasAppearanceControl( { supports, name } );
	const hasLetterSpacing = useHasLetterSpacingControl( { supports, name } );
	const hasTextDecoration = useHasTextDecorationControl( { supports, name } );
	const hasTextTransform = useHasTextTransformControl( { supports, name } );

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

function useHasLineHeightControl( { supports, name } ) {
	return (
		useSetting( 'typography.customLineHeight', name ) &&
		supports.includes( 'lineHeight' )
	);
}
function useHasAppearanceControl( { supports, name } ) {
	const hasFontStyles =
		useSetting( 'typography.customFontStyle', name ) &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useSetting( 'typography.customFontWeight', name ) &&
		supports.includes( 'fontWeight' );
	return hasFontStyles || hasFontWeights;
}

function useHasTextDecorationControl( { supports, name } ) {
	return (
		useSetting( 'typography.customTextDecoration', name ) &&
		supports.includes( 'textDecoration' )
	);
}

function useHasTextTransformControl( { supports, name } ) {
	return (
		useSetting( 'typography.customTextTransform', name ) &&
		supports.includes( 'textTransform' )
	);
}

function useHasLetterSpacingControl( { supports, name } ) {
	return (
		useSetting( 'typography.customLetterSpacing', name ) &&
		supports.includes( 'letterSpacing' )
	);
}

export default function TypographyPanel( {
	context: { supports, name },
	getStyle,
	setStyle,
} ) {
	// To better reflect if the user has customized a value we need to
	// ensure the style value being checked is from the `user` origin.
	const createHasValueCallback = ( feature ) => () =>
		!! getStyle( name, feature, 'user' );

	const createResetCallback = ( feature ) => () =>
		setStyle( name, feature, undefined );

	const handleOnChange = ( feature ) => ( value ) => {
		setStyle( name, feature, value );
	};

	// Font Family.
	const fontFamilies = useSetting( 'typography.fontFamilies', name );
	const showFontFamilyControl = supports.includes( 'fontFamily' );

	// Font Size.
	const fontSizes = useSetting( 'typography.fontSizes', name );
	const showFontSizeControl = supports.includes( 'fontSize' );
	const disableCustomFontSizes = ! useSetting(
		'typography.customFontSize',
		name
	);

	// Font Appearance.
	const showAppearanceControl = useHasAppearanceControl( { supports, name } );
	const fontStyle = getStyle( name, 'fontStyle' );
	const fontWeight = getStyle( name, 'fontWeight' );
	const hasFontAppearanceValue = () => !! fontStyle || !! fontWeight;
	const resetFontAppearance = () => {
		setStyle( name, 'fontStyle', undefined );
		setStyle( name, 'fontWeight', undefined );
	};

	const hasFontStyles =
		useSetting( 'typography.customFontStyle', name ) &&
		supports.includes( 'fontStyle' );

	const hasFontWeights =
		useSetting( 'typography.customFontWeight', name ) &&
		supports.includes( 'fontWeight' );

	// Line Height.
	const showLineHeightControl = useHasLineHeightControl( { supports, name } );

	// Text Decoration.
	const showTextDecoration = useHasTextDecorationControl( {
		supports,
		name,
	} );

	// Text Transform.
	const showTextTransform = useHasTextTransformControl( { supports, name } );

	// Letter Spacing.
	const showLetterSpacingControl = useHasLetterSpacingControl( {
		supports,
		name,
	} );

	// Reset all the typography related global styles.
	const resetAll = () => {
		setStyle( name, 'fontFamily', undefined );
		setStyle( name, 'fontSize', undefined );
		setStyle( name, 'fontStyle', undefined );
		setStyle( name, 'fontWeight', undefined );
		setStyle( name, 'lineHeight', undefined );
		setStyle( name, 'textDecoration', undefined );
		setStyle( name, 'textTransform', undefined );
		setStyle( name, 'letterSpacing', undefined );
	};

	return (
		<ToolsPanel
			label={ __( 'Typography options' ) }
			header={ __( 'Typography' ) }
			resetAll={ resetAll }
			className="typography-controls"
		>
			{ showFontFamilyControl && (
				<ToolsPanelItem
					hasValue={ createHasValueCallback( 'fontFamily' ) }
					label={ __( 'Font family' ) }
					onDeselect={ createResetCallback( 'fontFamily' ) }
					isShownByDefault={ true }
				>
					<FontFamilyControl
						fontFamilies={ fontFamilies }
						value={ getStyle( name, 'fontFamily' ) }
						onChange={ handleOnChange( 'fontFamily' ) }
					/>
				</ToolsPanelItem>
			) }
			{ showFontSizeControl && (
				<ToolsPanelItem
					hasValue={ createHasValueCallback( 'fontSize' ) }
					label={ __( 'Font size' ) }
					onDeselect={ createResetCallback( 'fontSize' ) }
					isShownByDefault={ true }
				>
					<FontSizePicker
						value={ getStyle( name, 'fontSize' ) }
						onChange={ handleOnChange( 'fontSize' ) }
						fontSizes={ fontSizes }
						disableCustomFontSizes={ disableCustomFontSizes }
						allowReset={ false }
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
							setStyle( name, 'fontStyle', newFontStyle );
							setStyle( name, 'fontWeight', newFontWeight );
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
					onDeselect={ createResetCallback( 'lineHeight' ) }
					isShownByDefault={ true }
				>
					<LineHeightControl
						value={ getStyle( name, 'lineHeight' ) }
						onChange={ handleOnChange( 'lineHeight' ) }
					/>
				</ToolsPanelItem>
			) }
			{ showTextDecoration && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ createHasValueCallback( 'textDecoration' ) }
					label={ __( 'Decoration' ) }
					onDeselect={ createResetCallback( 'textDecoration' ) }
					isShownByDefault={ true }
				>
					<TextDecorationControl
						value={ getStyle( name, 'textDecoration' ) }
						onChange={ handleOnChange( 'textDecoration' ) }
					/>
				</ToolsPanelItem>
			) }
			{ showTextTransform && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ createHasValueCallback( 'textTransform' ) }
					label={ __( 'Letter case' ) }
					onDeselect={ createResetCallback( 'textTransform' ) }
					isShownByDefault={ true }
				>
					<TextTransformControl
						value={ getStyle( name, 'textTransform' ) }
						onChange={ handleOnChange( 'textTransform' ) }
					/>
				</ToolsPanelItem>
			) }
			{ showLetterSpacingControl && (
				<ToolsPanelItem
					className="single-column"
					hasValue={ createHasValueCallback( 'letterSpacing' ) }
					label={ __( 'Letter-spacing' ) }
					onDeselect={ createResetCallback( 'letterSpacing' ) }
					isShownByDefault={ true }
				>
					<LetterSpacingControl
						value={ getStyle( name, 'letterSpacing' ) }
						onChange={ handleOnChange( 'letterSpacing' ) }
					/>
				</ToolsPanelItem>
			) }
		</ToolsPanel>
	);
}
