/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function WelcomeGuideMenuItem() {
	const { toggleFeature } = useDispatch( editPostStore );

	return (
		<MenuItem onClick={ () => toggleFeature( 'welcomeGuide' ) }>
			{ __( 'Welcome Guide' ) }
		</MenuItem>
	);
}
