/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';

export default function WelcomeGuideMenuItem() {
	const { toggle } = useDispatch( preferencesStore );

	return (
		<MenuItem onClick={ () => toggle( 'core/edit-site', 'welcomeGuide' ) }>
			{ __( 'Welcome Guide' ) }
		</MenuItem>
	);
}
