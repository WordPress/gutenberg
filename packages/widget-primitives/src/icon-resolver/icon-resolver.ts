/**
 * Icon resolver registry.
 *
 * A widget's `widget.json` may reference its icon by registered icon
 * name (`collection/icon-name`) instead of shipping a rendered element.
 * The application registers a single resolver that turns such a
 * reference into a renderable `WidgetIcon`; `useWidgetTypes` invokes it
 * while assembling each `WidgetType`, so hosts only ever receive
 * renderable icons.
 */

/**
 * Internal dependencies
 */
import type { WidgetIcon, WidgetIconReference } from '../types';

/**
 * Resolves an icon reference into a renderable icon, or `null` when the
 * reference does not resolve.
 */
export type WidgetIconResolver = (
	reference: WidgetIconReference
) => Promise< WidgetIcon | null >;

let iconResolver: WidgetIconResolver | undefined;

/**
 * Registers the icon resolver.
 *
 * First registration wins: a later call is ignored.
 *
 * @param resolver Resolver turning an icon reference into a renderable
 *                 icon.
 * @return The registered resolver, or `undefined` when ignored.
 */
export function registerIconResolver(
	resolver: WidgetIconResolver
): WidgetIconResolver | undefined {
	if ( iconResolver ) {
		return undefined;
	}

	iconResolver = resolver;
	return resolver;
}

/**
 * Unregisters the icon resolver.
 *
 * @return The removed resolver, or `undefined` when none was registered.
 */
export function unregisterIconResolver(): WidgetIconResolver | undefined {
	const resolver = iconResolver;
	iconResolver = undefined;

	return resolver;
}

/**
 * Resolves an icon reference through the registered resolver.
 *
 * Returns `null` when no resolver is registered or the resolver fails:
 * an unresolvable reference degrades to no icon rather than breaking.
 *
 * @param reference Icon reference to resolve.
 * @return The renderable icon, or `null`.
 */
export async function resolveIcon(
	reference: WidgetIconReference
): Promise< WidgetIcon | null > {
	if ( ! iconResolver ) {
		return null;
	}

	try {
		return await iconResolver( reference );
	} catch {
		return null;
	}
}
