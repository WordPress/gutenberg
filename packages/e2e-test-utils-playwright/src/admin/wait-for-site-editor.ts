/**
 * Internal dependencies
 */
import type { Admin } from './';

/**
 * Waits for the Site Editor to finish loading, i.e., for all resolvers
 * in the `core` store to finish and then pause for a short period.
 *
 * @param this
 */
export async function waitForSiteEditor( this: Admin ) {
	await this.page.evaluate( () => {
		const MAX_LOADING_TIME = 10000;
		const MAX_PAUSE_TIME = 100;

		return new Promise< void >( ( resolve ) => {
			let pauseTimeout: ReturnType< typeof setTimeout > | undefined;

			function finish() {
				unsubscribe();
				clearTimeout( pauseTimeout );
				clearTimeout( maxTimeout );
				resolve();
			}

			const maxTimeout = setTimeout( finish, MAX_LOADING_TIME );

			function checkResolving() {
				const isResolving = window.wp.data
					.select( 'core' )
					.hasResolvingSelectors();

				if ( isResolving ) {
					clearTimeout( pauseTimeout );
					pauseTimeout = undefined;
					return;
				}

				if ( ! pauseTimeout ) {
					pauseTimeout = setTimeout( finish, MAX_PAUSE_TIME );
				}
			}

			const unsubscribe = window.wp.data.subscribe(
				checkResolving,
				'core'
			);
			checkResolving();
		} );
	} );
}
