import { cloneElement, type VNode } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { signal, type Signal } from '@preact/signals';
import { directive, isDefaultDirectiveSuffix } from '../hooks';
import { warn } from '../utils';
import { getScope, navigationContextSignal } from '../scopes';
import { warnUniqueIdNotSupported } from './utils/warnings';

/**
 * Relates each router region with its current vDOM content. Used by the
 * `router-region` directive.
 *
 * Keys are router region IDs, and values are signals with the corresponding
 * VNode rendered inside. If the value is `null`, that means the regions should
 * not be rendered. If the value is `undefined`, the region is already contained
 * inside another router region and does not need to change its children.
 */
export const routerRegions = new Map<
	string,
	Signal< VNode | null | undefined >
>();

// data-wp-router-region — Router region management.
directive(
	'router-region',
	( { directives: { 'router-region': routerRegion } } ) => {
		const entry = routerRegion.find( isDefaultDirectiveSuffix );
		if ( ! entry ) {
			return;
		}

		if ( entry.suffix ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warn(
					`Suffixes for the data-wp-router-region directive are not supported. Ignoring the directive with suffix "${ entry.suffix }".`
				);
			}
			return;
		}

		if ( entry.uniqueId ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnUniqueIdNotSupported( 'router-region', entry.uniqueId );
			}
			return;
		}

		const regionId =
			typeof entry.value === 'string'
				? entry.value
				: ( entry.value as any ).id;

		if ( ! routerRegions.has( regionId ) ) {
			routerRegions.set( regionId, signal() );
		}

		// Get the content of this router region.
		const vdom = routerRegions.get( regionId )!.value;

		// Triggers an invalidation after the directive data-wp-context has
		// been evaluated and the value of the server context has changed.
		useLayoutEffect( () => {
			if ( vdom && typeof vdom.type !== 'string' ) {
				navigationContextSignal.value =
					navigationContextSignal.peek() + 1;
			}
		}, [ vdom ] );

		if ( vdom && typeof vdom.type !== 'string' ) {
			// The scope needs to be injected.
			const previousScope = getScope();
			return cloneElement( vdom, { previousScope } );
		}
		return vdom;
	},
	{ priority: 1 }
);
