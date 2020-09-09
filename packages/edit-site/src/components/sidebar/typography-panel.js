/**
 * WordPress dependencies
 */
import {
	FontSizePicker,
	__experimentalLineHeightControl as LineHeightControl,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { STYLE_PROPERTY } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { fromPx, toPx } from '../editor/utils';

export default ( {
	context: { supports, name },
	getProperty,
	setProperty,
} ) => {
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
					value={ fromPx(
						getProperty( name, STYLE_PROPERTY.fontSize )
					) }
					onChange={ ( value ) =>
						setProperty(
							name,
							STYLE_PROPERTY.fontSize,
							toPx( value )
						)
					}
				/>
			) }
			{ supports.includes( 'lineHeight' ) && (
				<LineHeightControl
					value={ getProperty( name, STYLE_PROPERTY.lineHeight ) }
					onChange={ ( value ) =>
						setProperty( name, STYLE_PROPERTY.lineHeight, value )
					}
				/>
			) }
		</PanelBody>
	);
};
