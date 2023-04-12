/**
 * Internal dependencies
 */
import { useNavigationCommands } from './use-navigation-commands';
import { useWPAdminCommands } from './use-wp-admin-commands';

export function useCommands() {
	useWPAdminCommands();
	useNavigationCommands();
}
