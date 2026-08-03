/**
 * External dependencies
 */
import { dequal } from 'dequal';

/**
 * WordPress dependencies
 */
import type { View, Filter, SupportedLayouts } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { ViewOverrides } from './types';

type PlainObject = Record< string, unknown >;

/**
 * `page` and `search` are URL-managed: the URL is their only source. They are
 * never persisted, and no other layer may configure them — an absent URL param
 * is indistinguishable from the user having cleared the value, so any fallback
 * would resurrect a cleared search on the next read.
 */
const QUERY_PARAMS = [ 'page', 'search' ] as const;

function isPlainObject( value: unknown ): value is PlainObject {
	return (
		typeof value === 'object' && value !== null && ! Array.isArray( value )
	);
}

/**
 * Copies a layer without the URL-managed properties.
 *
 * @param layer The layer to copy.
 * @return A copy of the layer with `page` and `search` removed.
 */
function withoutQueryParams( layer: unknown ): PlainObject {
	const result: PlainObject = isPlainObject( layer ) ? { ...layer } : {};
	for ( const key of QUERY_PARAMS ) {
		delete result[ key ];
	}
	return result;
}

/**
 * Merges a layer on top of another, recursing into plain objects so the upper
 * layer only takes over the leaves it declares. Arrays and scalars are leaves:
 * they are replaced wholesale.
 *
 * Nested properties (`layout.styles.<field>.width`, `groupBy.direction`,
 * `sort.direction`) are merged leaf by leaf: a shallow merge would let a layer
 * that only declares one leaf wipe every sibling the layers below provide.
 *
 * @param lower The layer to merge into.
 * @param upper The layer to merge on top.
 * @return The merged layer.
 */
function mergeLayer( lower: PlainObject, upper: PlainObject ): PlainObject {
	const result: PlainObject = { ...lower };
	for ( const key of Object.keys( upper ) ) {
		const value = upper[ key ];
		const current = result[ key ];
		result[ key ] =
			isPlainObject( current ) && isPlainObject( value )
				? mergeLayer( current, value )
				: value;
	}
	return result;
}

/**
 * The leaves of `value` that differ from `base`. Mirrors `mergeLayer`:
 * `mergeLayer( base, diffLayer( value, base ) )` resolves back to `value`.
 *
 * A persisted leaf that equals both `value` and `base` is kept even though it
 * is not a difference: the preference is shared by every view of the same
 * entity, and such a leaf may only differ from the base of *another* view. In
 * this one, where it coincides with the base, a revert is unobservable — so
 * equality cannot mean the user reverted it. Dropping a persisted leaf
 * requires `value` to actually move away from it, back to `base`.
 *
 * @param value     The layer to compare.
 * @param base      The layer to compare it against.
 * @param persisted The previously persisted leaves.
 * @return The leaves that differ, as a layer of its own.
 */
function diffLayer(
	value: PlainObject,
	base: PlainObject,
	persisted: PlainObject = {}
): PlainObject {
	const result: PlainObject = {};
	for ( const key of Object.keys( value ) ) {
		const next = value[ key ];
		const current = base[ key ];
		const prev = persisted[ key ];
		if ( next === undefined ) {
			continue;
		}
		if ( isPlainObject( next ) && isPlainObject( current ) ) {
			const nested = diffLayer(
				next,
				current,
				isPlainObject( prev ) ? prev : {}
			);
			if ( Object.keys( nested ).length > 0 ) {
				result[ key ] = nested;
			}
		} else if ( ! dequal( next, current ) ) {
			result[ key ] = next;
		} else if ( prev !== undefined && dequal( next, prev ) ) {
			result[ key ] = prev;
		}
	}
	return result;
}

function getLockedFilters( overrides?: ViewOverrides ): Filter[] {
	return ( overrides?.filters ?? [] ).filter( ( filter ) => filter.isLocked );
}

/**
 * Hoists the locked filters an override provides to the front of the view's
 * filters, replacing any same-field filter. Locked filters are not the user's
 * to change, so they are pinned in place instead of taking part in the layer
 * resolution.
 *
 * @param view      The view to apply the locked filters to.
 * @param overrides The active view overrides.
 * @return The view with the locked filters applied.
 */
function applyLockedFilters(
	view: PlainObject,
	overrides?: ViewOverrides
): PlainObject {
	const locked = getLockedFilters( overrides );
	if ( locked.length === 0 ) {
		return view;
	}
	const rest = ( ( view.filters ?? [] ) as Filter[] ).filter(
		( filter ) => ! locked.some( ( f ) => f.field === filter.field )
	);
	return { ...view, filters: [ ...locked, ...rest ] };
}

interface ViewLayers {
	defaultView?: View;
	defaultLayouts?: SupportedLayouts;
	activeViewOverrides?: ViewOverrides;
	/**
	 * The user's persisted modifications: a partial view holding only the
	 * properties they actually changed.
	 */
	persistedView?: ViewOverrides;
}

interface ResolveViewArgs extends ViewLayers {
	page?: number;
	search?: string;
}

/**
 * Resolves the layers below the user's modifications — what a modification has
 * to differ from to count as one. The layout type selects which entry of
 * `defaultLayouts` applies, so the base only makes sense relative to a type.
 *
 * @param layers        The layers to resolve.
 * @param effectiveType The layout type to resolve the base at.
 * @return The resolved base view.
 */
function resolveBaseView(
	layers: ViewLayers,
	effectiveType: View[ 'type' ] | undefined
): PlainObject {
	const { defaultView, defaultLayouts, activeViewOverrides } = layers;
	const layoutDefaults =
		defaultLayouts?.[ effectiveType as keyof SupportedLayouts ];
	return applyLockedFilters(
		[ layoutDefaults, activeViewOverrides ].reduce< PlainObject >(
			( lower, upper ) =>
				mergeLayer( lower, withoutQueryParams( upper ) ),
			withoutQueryParams( defaultView )
		),
		activeViewOverrides
	);
}

/**
 * Resolves a view out of its layers. Later layers override earlier ones:
 *
 * 1. `defaultView`
 * 2. `defaultLayouts` (for the effective type)
 * 3. `activeViewOverrides`
 * 4. the user's persisted modifications
 * 5. the URL query params (`page` and `search` only)
 *
 * @param args See `ResolveViewArgs`.
 * @return The resolved `view`.
 */
export function resolveView( args: ResolveViewArgs ): View {
	const { defaultView, activeViewOverrides, persistedView, page, search } =
		args;

	// Resolve the effective layout type first: it selects which entry of
	// `defaultLayouts` applies, and the layers above the layouts may change it.
	const effectiveType =
		persistedView?.type ?? activeViewOverrides?.type ?? defaultView?.type;
	const baseView = resolveBaseView( args, effectiveType );

	const view = {
		...applyLockedFilters(
			mergeLayer( baseView, withoutQueryParams( persistedView ) ),
			activeViewOverrides
		),
		page: Number( page ?? 1 ),
		search: search ?? '',
	};

	// The layers are resolved as plain objects: `View` requires a `type`, which
	// only the layers taken together are guaranteed to provide.
	return view as unknown as View;
}

/**
 * The user's modifications: the leaves of the view they interacted with that
 * the layers below do not already resolve to. This is what gets persisted, so
 * that a change to any of those layers keeps showing through the properties the
 * user never touched.
 *
 * Previously persisted leaves that coincide with the base of the current view
 * are carried over rather than dropped: they may still make a difference in
 * another view sharing the preference. See `diffLayer`.
 *
 * The diff basis is resolved at `newView.type`, not at the type the previous
 * resolution used: the type selects the `defaultLayouts` entry, and a layout
 * switch reports the new type together with that entry's values. Diffing them
 * against the previous type's base would persist the difference between the
 * two entries as if the user had picked those values — leaves the layouts
 * already provide, which then linger as phantom modifications after switching
 * back.
 *
 * @param newView The view the user produced.
 * @param layers  The layers the view resolves from. See `ViewLayers`.
 * @return The modified properties, or `undefined` when the user modified none.
 */
export function getUserModifications(
	newView: View,
	layers: ViewLayers
): ViewOverrides | undefined {
	const { activeViewOverrides, persistedView } = layers;
	const baseView = resolveBaseView( layers, newView.type );

	const modifications = diffLayer(
		withoutQueryParams( newView ),
		withoutQueryParams( baseView ),
		withoutQueryParams( persistedView )
	);

	// Locked filters are pinned on every read, so persisting them would only
	// leak them into the views that do not lock them.
	const locked = getLockedFilters( activeViewOverrides );
	if ( locked.length > 0 && Array.isArray( modifications.filters ) ) {
		modifications.filters = ( modifications.filters as Filter[] ).filter(
			( filter ) => ! locked.some( ( f ) => f.field === filter.field )
		);
	}

	return Object.keys( modifications ).length > 0
		? ( modifications as ViewOverrides )
		: undefined;
}
