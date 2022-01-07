/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

export default function WelcomeGuideMenuItem() {
	const { toggleFeature } = useDispatch( editSiteStore );

	return (
		<MenuItem onClick={ () => toggleFeature( 'welcomeGuide' ) }>
			{ __( 'Welcome Guide' ) }
		</MenuItem>
	);
}
