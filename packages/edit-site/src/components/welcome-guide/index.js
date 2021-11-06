/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import WelcomeGuideEditor from './editor';
import WelcomeGuideStyles from './styles';
import { store as editSiteStore } from '../../store';

export default function WelcomeGuide() {
	const { isActive, isStylesOpen } = useSelect( ( select ) => {
		const sidebar = select( interfaceStore ).getActiveComplementaryArea(
			editSiteStore.name
		);
		const isStylesSidebar = sidebar === 'edit-site/global-styles';
		const feature = isStylesSidebar ? 'welcomeGuideStyles' : 'welcomeGuide';

		return {
			isActive: select( editSiteStore ).isFeatureActive( feature ),
			isStylesOpen: isStylesSidebar,
		};
	}, [] );

	if ( ! isActive ) {
		return null;
	}

	return isStylesOpen ? <WelcomeGuideStyles /> : <WelcomeGuideEditor />;
}
