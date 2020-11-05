/**
 * WordPress dependencies
 */
import {
	LineHeightControl,
	__experimentalFontFamilyControl as FontFamilyControl,
	__experimentalFontWeightControl as FontWeightControl,
} from '@wordpress/block-editor';
import { PanelBody, FontSizePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useEditorFeature } from '../editor/utils';

function useHasFontWeight( { supports, name } ) {
	return (
		useEditorFeature( 'typography.fontWeight', name ) &&
		supports.includes( 'fontWeight' )
	);
}

export function useHasTypographyPanel( { supports, name } ) {
	return (
		useHasFontWeight( { supports, name } ) ||
		supports.includes( 'fontSize' ) ||
		supports.includes( 'lineHeight' )
	);
}

export default function TypographyPanel( {
	context: { supports, name },
	getStyleProperty,
	setStyleProperty,
} ) {
	const fontSizes = useEditorFeature( 'typography.fontSizes', name );
	const disableCustomFontSizes = ! useEditorFeature(
		'typography.customFontSize',
		name
	);
	const fontFamilies = useEditorFeature( 'typography.fontFamilies', name );
	const hasFontWeightEnabled = useHasFontWeight( { supports, name } );

	return (
		<PanelBody title={ __( 'Typography' ) } initialOpen={ true }>
			{ supports.includes( 'fontFamily' ) && (
				<FontFamilyControl
					value={ getStyleProperty( name, 'fontFamily' ) }
					onChange={ ( value ) =>
						setStyleProperty( name, 'fontFamily', value )
					}
				/>
			) }
			{ hasFontWeightEnabled && (
				<FontWeightControl
					value={ getStyleProperty( name, 'fontWeight' ) }
					onChange={ ( value ) =>
						setStyleProperty( name, 'fontWeight', value )
					}
				/>
			) }
			{ supports.includes( 'fontSize' ) && (
				<FontSizePicker
					value={ getStyleProperty( name, 'fontSize' ) }
					onChange={ ( value ) =>
						setStyleProperty( name, 'fontSize', value )
					}
					fontSizes={ fontSizes }
					disableCustomFontSizes={ disableCustomFontSizes }
				/>
			) }
			{ supports.includes( 'lineHeight' ) && (
				<LineHeightControl
					fontFamilies={ fontFamilies }
					value={ getStyleProperty( name, 'lineHeight' ) }
					onChange={ ( value ) =>
						setStyleProperty( name, 'lineHeight', value )
					}
				/>
			) }
		</PanelBody>
	);
}
