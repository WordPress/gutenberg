/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { lazy } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	ResolveWidgetModule,
	WidgetModule,
	WidgetRenderProps,
} from '../../types';

type LazyWidgetComponent = ComponentType< WidgetRenderProps< unknown > >;

function isValidWidgetModule( module: unknown ): module is WidgetModule {
	return (
		typeof module === 'object' &&
		module !== null &&
		'default' in module &&
		typeof ( module as { default: unknown } ).default === 'function'
	);
}

/*
 * Cache keyed by `renderModule`. The lazy component must keep a stable
 * identity across renders; rebuilding it inline (e.g. via `useMemo`) resets
 * the Suspense boundary and the resolved module.
 */
const componentCache = new Map< string, LazyWidgetComponent >();

/*
 * Resolve a widget render module to a `lazy()` React component, cached by
 * `renderModule` id so repeated calls return the same instance.
 */
export function getLazyWidgetComponent(
	renderModule: string,
	resolveWidgetModule: ResolveWidgetModule
): LazyWidgetComponent {
	const cached = componentCache.get( renderModule );
	if ( cached ) {
		return cached;
	}

	const lazyComponent = lazy< LazyWidgetComponent >( async () => {
		const module: unknown = await resolveWidgetModule( renderModule );
		if ( ! isValidWidgetModule( module ) ) {
			throw new Error( `Invalid widget module: ${ renderModule }` );
		}

		return module;
	} );

	componentCache.set( renderModule, lazyComponent );
	return lazyComponent;
}
