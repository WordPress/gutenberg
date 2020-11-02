/**
 * WordPress dependencies
 */
import { LineHeightControl } from '@wordpress/block-editor';
import { PanelBody, FontSizePicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useEditorFeature } from '../editor/utils';

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

	if (
		! supports.includes( 'fontSize' ) &&
		! supports.includes( 'lineHeight' )
	) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Typography' ) } initialOpen={ true }>
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
					value={ getStyleProperty( name, 'lineHeight' ) }
					onChange={ ( value ) =>
						setStyleProperty( name, 'lineHeight', value )
					}
				/>
			) }
		</PanelBody>
	);
}
