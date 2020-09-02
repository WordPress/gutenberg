/**
 * WordPress dependencies
 */
import {
	FontSizePicker,
	__experimentalLineHeightControl as LineHeightControl,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { FONT_SIZE, LINE_HEIGHT, fromPx, toPx } from '../editor/utils';

export default ( {
	context: { supports, name },
	getProperty,
	setProperty,
} ) => {
	if (
		! supports.includes( FONT_SIZE ) &&
		! supports.includes( LINE_HEIGHT )
	) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Typography' ) } initialOpen={ true }>
			{ supports.includes( FONT_SIZE ) && (
				<FontSizePicker
					value={ fromPx(
						getProperty( name, 'typography.fontSize' )
					) }
					onChange={ ( value ) =>
						setProperty( name, {
							'typography.fontSize': toPx( value ),
						} )
					}
				/>
			) }
			{ supports.includes( LINE_HEIGHT ) && (
				<LineHeightControl
					value={ getProperty( name, 'typography.lineHeight' ) }
					onChange={ ( value ) =>
						setProperty( name, { 'typography.lineHeight': value } )
					}
				/>
			) }
		</PanelBody>
	);
};
