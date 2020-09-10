/**
 * WordPress dependencies
 */
import {
	FontSizePicker,
	__experimentalLineHeightControl as LineHeightControl,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { __EXPERIMENTAL_STYLE_PROPERTY as STYLE_PROPERTY } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { fromPx, toPx } from '../editor/utils';

export default ( {
	context: { supports, name },
	getStyleProperty,
	setStyleProperty,
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
						getStyleProperty( name, STYLE_PROPERTY.fontSize )
					) }
					onChange={ ( value ) =>
						setStyleProperty(
							name,
							STYLE_PROPERTY.fontSize,
							toPx( value )
						)
					}
				/>
			) }
			{ supports.includes( 'lineHeight' ) && (
				<LineHeightControl
					value={ getStyleProperty(
						name,
						STYLE_PROPERTY.lineHeight
					) }
					onChange={ ( value ) =>
						setStyleProperty(
							name,
							STYLE_PROPERTY.lineHeight,
							value
						)
					}
				/>
			) }
		</PanelBody>
	);
};
