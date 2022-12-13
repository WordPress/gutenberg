/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { formatBold } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import useTypographyStyle from './use-typography-style';

export default function BoldControl( { typographyStyle, onChange } ) {
	const { isBold, boldToggleTypography } =
		useTypographyStyle( typographyStyle );
	return (
		<ToolbarButton
			icon={ formatBold }
			label={ __( 'Bold' ) }
			isPressed={ isBold }
			onClick={ () => onChange( boldToggleTypography ) }
		/>
	);
}
