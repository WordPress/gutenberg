/**
 * External dependencies
 */
import { useRouter, type AnyRouter } from '@tanstack/react-router';
export {
	Link,
	notFound,
	redirect,
	useLinkProps,
	useNavigate,
	useParams,
	useSearch,
} from '@tanstack/react-router';

export type {
	AnyRoute,
	LinkProps,
	NavigateOptions,
	RouteOptions,
	RouterOptions,
	ToOptions,
	UseNavigateResult,
} from '@tanstack/react-router';

/**
 * Curated router instance type.
 *
 * Exposes only the properties that this package considers stable
 * and supported for consumers: reading state, navigating,
 * subscribing to lifecycle events, and invalidating the cache.
 *
 * Consumers can derive sub-types as needed:
 * - `Router['state']` for the router state
 * - `Router['state']['location']` for the current location
 * - `Router['state']['matches']` for the route matches
 */
export type Router = Pick<
	AnyRouter,
	'state' | 'navigate' | 'subscribe' | 'invalidate' | 'options' | 'history'
>;

/**
 * Internal dependencies
 */
export { privateApis } from './private-apis';

/**
 * Hook to invalidate the router cache and trigger a re-render.
 * This is useful when you want to refetch data without changing the URL.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const invalidate = useInvalidate();
 *
 *   const handleRefresh = () => {
 *     invalidate();
 *   };
 *
 *   return <button onClick={handleRefresh}>Refresh</button>;
 * }
 * ```
 *
 * @return A function to invalidate the router.
 */
export function useInvalidate() {
	const router = useRouter();
	return () => router.invalidate();
}
