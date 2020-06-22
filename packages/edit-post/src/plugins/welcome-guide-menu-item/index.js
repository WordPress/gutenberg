/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function WelcomeGuideMenuItem() {
	const { toggleFeature } = useDispatch( 'core/edit-post' );

	return (
		<MenuItem onClick={ () => toggleFeature( 'welcomeGuide' ) }>
			{ __( 'Welcome Guide' ) }
		</MenuItem>
	);
}
