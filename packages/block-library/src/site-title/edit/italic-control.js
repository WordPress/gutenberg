/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { formatItalic } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useTypographyStyle from './use-typography-style';

export default function ItalicControl( { typographyStyle, onChange } ) {
	const { isItalic, italicToggleTypography } =
		useTypographyStyle( typographyStyle );
	return (
		<ToolbarButton
			icon={ formatItalic }
			label={ __( 'Italic' ) }
			isPressed={ isItalic }
			onClick={ () => onChange( italicToggleTypography ) }
		/>
	);
}
