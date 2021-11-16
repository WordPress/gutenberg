/**
 * WordPress dependencies
 */
import {
	LineHeightControl,
	__experimentalFontFamilyControl as FontFamilyControl,
	__experimentalFontAppearanceControl as FontAppearanceControl,
	__experimentalLetterSpacingControl as LetterSpacingControl,
} from '@wordpress/block-editor';
import { PanelBody, FontSizePicker } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getSupportedGlobalStylesPanels, useSetting, useStyle } from './hooks';

export function useHasTypographyPanel( name ) {
	const hasLineHeight = useHasLineHeightControl( name );
	const hasFontAppearance = useHasAppearanceControl( name );
	const hasLetterSpacing = useHasLetterSpacingControl( name );
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		hasLineHeight ||
		hasFontAppearance ||
		hasLetterSpacing ||
		supports.includes( 'fontSize' )
	);
}

function useHasLineHeightControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'typography.lineHeight', name )[ 0 ] &&
		supports.includes( 'lineHeight' )
	);
}

function useHasAppearanceControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasFontStyles =
		useSetting( 'typography.fontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useSetting( 'typography.fontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );
	return hasFontStyles || hasFontWeights;
}

function useHasLetterSpacingControl( name ) {
	const supports = getSupportedGlobalStylesPanels( name );
	return (
		useSetting( 'typography.letterSpacing', name )[ 0 ] &&
		supports.includes( 'letterSpacing' )
	);
}

export default function TypographyPanel( { name } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const [ fontSizes ] = useSetting( 'typography.fontSizes', name );
	const disableCustomFontSizes = ! useSetting(
		'typography.customFontSize',
		name
	)[ 0 ];
	const [ fontFamilies ] = useSetting( 'typography.fontFamilies', name );
	const hasFontStyles =
		useSetting( 'typography.fontStyle', name )[ 0 ] &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useSetting( 'typography.fontWeight', name )[ 0 ] &&
		supports.includes( 'fontWeight' );
	const hasLineHeightEnabled = useHasLineHeightControl( name );
	const hasAppearanceControl = useHasAppearanceControl( name );
	const hasLetterSpacingControl = useHasLetterSpacingControl( name );

	const [ fontFamily, setFontFamily ] = useStyle(
		'typography.fontFamily',
		name
	);
	const [ fontSize, setFontSize ] = useStyle( 'typography.fontSize', name );

	const [ fontStyle, setFontStyle ] = useStyle(
		'typography.fontStyle',
		name
	);
	const [ fontWeight, setFontWeight ] = useStyle(
		'typography.fontWeight',
		name
	);
	const [ lineHeight, setLineHeight ] = useStyle(
		'typography.lineHeight',
		name
	);
	const [ letterSpacing, setLetterSpacing ] = useStyle(
		'typography.letterSpacing',
		name
	);

	return (
		<PanelBody className="edit-site-typography-panel" initialOpen={ true }>
			{ supports.includes( 'fontFamily' ) && (
				<FontFamilyControl
					fontFamilies={ fontFamilies }
					value={ fontFamily }
					onChange={ setFontFamily }
				/>
			) }
			{ supports.includes( 'fontSize' ) && (
				<FontSizePicker
					value={ fontSize }
					onChange={ setFontSize }
					fontSizes={ fontSizes }
					disableCustomFontSizes={ disableCustomFontSizes }
				/>
			) }
			{ hasLineHeightEnabled && (
				<LineHeightControl
					value={ lineHeight }
					onChange={ setLineHeight }
				/>
			) }
			{ hasAppearanceControl && (
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
				/>
			) }
			{ hasLetterSpacingControl && (
				<LetterSpacingControl
					value={ letterSpacing }
					onChange={ setLetterSpacing }
				/>
			) }
		</PanelBody>
	);
}
