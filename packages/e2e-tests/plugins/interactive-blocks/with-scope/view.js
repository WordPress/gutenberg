/**
 * WordPress dependencies
 */
import { store, getContext, withScope } from '@wordpress/interactivity';

store( 'with-scope', {
	callbacks: {
		asyncInit: () => {
			setTimeout(
				withScope( function* () {
					yield new Promise( ( resolve ) =>
						setTimeout( resolve, 1 )
					);
					const context = getContext();
					context.asyncCounter += 1;
				}, 1 )
			);
		},
		syncInit: () => {
			const context = getContext();
			context.syncCounter += 1;
		},
	},
} );
