/**
 * WordPress dependencies
 */
import {
	LineHeightControl,
	__experimentalFontFamilyControl as FontFamilyControl,
	__experimentalFontAppearanceControl as FontAppearanceControl,
} from '@wordpress/block-editor';
import { PanelBody, FontSizePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useThemeSetting } from '../editor/utils';

export function useHasTypographyPanel( { supports, name } ) {
	const hasLineHeight = useHasLineHeightControl( { supports, name } );
	const hasFontAppearance = useHasAppearanceControl( { supports, name } );
	return (
		hasLineHeight || hasFontAppearance || supports.includes( 'fontSize' )
	);
}

function useHasLineHeightControl( { supports, name } ) {
	return (
		useThemeSetting( 'typography.customLineHeight', name ) &&
		supports.includes( 'lineHeight' )
	);
}

function useHasAppearanceControl( { supports, name } ) {
	const hasFontStyles =
		useThemeSetting( 'typography.customFontStyle', name ) &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useThemeSetting( 'typography.customFontWeight', name ) &&
		supports.includes( 'fontWeight' );
	return hasFontStyles || hasFontWeights;
}

export default function TypographyPanel( {
	context: { supports, name },
	getStyle,
	setStyle,
} ) {
	const fontSizes = useThemeSetting( 'typography.fontSizes', name );
	const disableCustomFontSizes = ! useThemeSetting(
		'typography.customFontSize',
		name
	);
	const fontFamilies = useThemeSetting( 'typography.fontFamilies', name );
	const hasFontStyles =
		useThemeSetting( 'typography.customFontStyle', name ) &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useThemeSetting( 'typography.customFontWeight', name ) &&
		supports.includes( 'fontWeight' );
	const hasLineHeightEnabled = useHasLineHeightControl( { supports, name } );
	const hasAppearanceControl = useHasAppearanceControl( { supports, name } );

	return (
		<PanelBody title={ __( 'Typography' ) } initialOpen={ true }>
			{ supports.includes( 'fontFamily' ) && (
				<FontFamilyControl
					fontFamilies={ fontFamilies }
					value={ getStyle( name, 'fontFamily' ) }
					onChange={ ( value ) =>
						setStyle( name, 'fontFamily', value )
					}
				/>
			) }
			{ supports.includes( 'fontSize' ) && (
				<FontSizePicker
					value={ getStyle( name, 'fontSize' ) }
					onChange={ ( value ) =>
						setStyle( name, 'fontSize', value )
					}
					fontSizes={ fontSizes }
					disableCustomFontSizes={ disableCustomFontSizes }
				/>
			) }
			{ hasLineHeightEnabled && (
				<LineHeightControl
					value={ getStyle( name, 'lineHeight' ) }
					onChange={ ( value ) =>
						setStyle( name, 'lineHeight', value )
					}
				/>
			) }
			{ hasAppearanceControl && (
				<FontAppearanceControl
					value={ {
						fontStyle: getStyle( name, 'fontStyle' ),
						fontWeight: getStyle( name, 'fontWeight' ),
					} }
					onChange={ ( { fontStyle, fontWeight } ) => {
						setStyle( name, 'fontStyle', fontStyle );
						setStyle( name, 'fontWeight', fontWeight );
					} }
					hasFontStyles={ hasFontStyles }
					hasFontWeights={ hasFontWeights }
				/>
			) }
		</PanelBody>
	);
}
