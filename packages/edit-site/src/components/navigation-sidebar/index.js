/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import NavigationPanel from './navigation-panel';
import NavigationToggle from './navigation-toggle';

const NavigationSidebar = () => {
	const isNavigationOpen = useSelect( ( select ) => {
		return select( 'core/edit-site' ).isNavigationOpened();
	} );

	return (
		<>
			<NavigationToggle isOpen={ isNavigationOpen } />
			{ isNavigationOpen && <NavigationPanel /> }
		</>
	);
};

export default NavigationSidebar;
