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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSetting } from '../editor/utils';

export function useHasTypographyPanel( { supports, name } ) {
	const hasLineHeight = useHasLineHeightControl( { supports, name } );
	const hasFontAppearance = useHasAppearanceControl( { supports, name } );
	const hasLetterSpacing = useHasLetterSpacingControl( { supports, name } );
	return (
		hasLineHeight ||
		hasFontAppearance ||
		hasLetterSpacing ||
		supports.includes( 'fontSize' )
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
	const fontSizes = useSetting( 'typography.fontSizes', name );
	const disableCustomFontSizes = ! useSetting(
		'typography.customFontSize',
		name
	);
	const fontFamilies = useSetting( 'typography.fontFamilies', name );
	const hasFontStyles =
		useSetting( 'typography.customFontStyle', name ) &&
		supports.includes( 'fontStyle' );
	const hasFontWeights =
		useSetting( 'typography.customFontWeight', name ) &&
		supports.includes( 'fontWeight' );
	const hasLineHeightEnabled = useHasLineHeightControl( { supports, name } );
	const hasAppearanceControl = useHasAppearanceControl( { supports, name } );
	const hasLetterSpacingControl = useHasLetterSpacingControl( {
		supports,
		name,
	} );

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
			{ hasLetterSpacingControl && (
				<LetterSpacingControl
					value={ getStyle( name, 'letterSpacing' ) }
					onChange={ ( value ) =>
						setStyle( name, 'letterSpacing', value )
					}
				/>
			) }
		</PanelBody>
	);
}
