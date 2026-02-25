/**
 * Internal dependencies
 */
import useFocusNavigationBlock from './use-focus-navigation-block';

/**
 * Component that applies focus to a navigation block when navigating from the
 * Navigation sidebar with focusNavigationBlock in the URL. Renders nothing.
 */
export default function FocusNavigationBlock() {
	useFocusNavigationBlock();
	return null;
}
