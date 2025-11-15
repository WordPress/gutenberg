/**
 * External dependencies
 */
import { useRouter } from '@tanstack/react-router';
export {
	Link,
	redirect,
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
