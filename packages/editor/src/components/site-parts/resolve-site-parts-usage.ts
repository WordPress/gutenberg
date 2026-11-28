import { select, subscribe } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { unlock } from '../../lock-unlock';
import type { SitePartsUsage } from './use-site-part';

/**
 * Resolves the site parts usage outside React, for route loaders that need
 * the primary part before the screen renders.
 *
 * @return The usage, once the records it needs have loaded.
 */
export function resolveSitePartsUsage(): Promise< SitePartsUsage > {
	return new Promise( ( resolve ) => {
		let unsubscribe: ( () => void ) | undefined;
		let isDone = false;
		const check = () => {
			if ( isDone ) {
				return;
			}
			// Selecting starts the resolvers of everything the usage needs.
			const usage = unlock( select( coreStore ) ).getSitePartsUsage();
			if ( usage ) {
				isDone = true;
				unsubscribe?.();
				resolve( usage );
			}
		};
		check();
		if ( ! isDone ) {
			unsubscribe = subscribe( check, coreStore );
		}
	} );
}
