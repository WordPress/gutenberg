/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function WelcomeGuideMenuItem() {
	const { enableTips } = useDispatch( 'core/nux' );

	return (
		<MenuItem onClick={ enableTips }>
			{ __( 'Welcome Guide' ) }
		</MenuItem>
	);
}
