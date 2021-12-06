/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { MenuItem } from '@wordpress/components';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../store';

export default function WelcomeGuideMenuItem() {
	const { toggleFeature } = useDispatch( editSiteStore );
	const isStylesOpen = useSelect( ( select ) => {
		const sidebar = select( interfaceStore ).getActiveComplementaryArea(
			editSiteStore.name
		);

		return sidebar === 'edit-site/global-styles';
	}, [] );

	return (
		<MenuItem
			onClick={ () =>
				toggleFeature(
					isStylesOpen ? 'welcomeGuideStyles' : 'welcomeGuide'
				)
			}
		>
			{ __( 'Welcome Guide' ) }
		</MenuItem>
	);
}
