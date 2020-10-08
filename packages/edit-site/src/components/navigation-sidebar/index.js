/**
 * Internal dependencies
 */
import NavigationPanel from './navigation-panel';
import NavigationToggle from './navigation-toggle';

const NavigationSidebar = ( { content, isOpen, onNavigationToggle } ) => {
	return (
		<>
			<NavigationToggle
				isOpen={ isOpen }
				onClick={ onNavigationToggle }
			/>
			{ content === 'navigation' && isOpen && <NavigationPanel /> }
		</>
	);
};

export default NavigationSidebar;
