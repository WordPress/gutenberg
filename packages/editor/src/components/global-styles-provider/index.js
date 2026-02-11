/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useGlobalStyles } from '../global-styles';

/**
 * Hook to get global styles context.
 *
 * This hook is template-aware: when editing a template with an associated
 * style variation, it returns that variation's styles instead of the default.
 *
 * @return {Object} Global styles context with merged, base, user, and setUserConfig.
 */
export function useGlobalStylesContext() {
	const { merged, base, user, setUser, isReady } = useGlobalStyles();

	const context = useMemo( () => {
		return {
			isReady,
			user,
			base,
			merged,
			setUserConfig: setUser,
		};
	}, [ merged, user, base, setUser, isReady ] );

	return context;
}
