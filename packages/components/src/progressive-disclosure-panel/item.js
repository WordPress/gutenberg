/**
 * Internal dependencies
 */
import { usePanelContext } from './';

// This wraps controls to be conditionally displayed within a progressive
// disclosure panel. It helps prevent props being applied to HTML elements that
// would otherwise be invalid.
const ProgressiveDisclosurePanelItem = ( props ) => {
	const { children, isShownByDefault, label } = props;
	const menuItems = usePanelContext();

	// Do not show if menu item not selected and not shown by default.
	// If the item has a value that will be reflected in the menu item's
	// selected status provided by context.
	if ( ! menuItems[ label ] && ! isShownByDefault ) {
		return null;
	}

	return children;
};

export default ProgressiveDisclosurePanelItem;
