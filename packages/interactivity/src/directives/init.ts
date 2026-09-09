import { directive } from '../hooks';
import { useInit } from '../utils';
import { warnUniqueIdWithTwoHyphens } from './utils/warnings';

// data-wp-init---[unique-id] — Run expression on first render.
directive( 'init', ( { directives: { init }, evaluate } ) => {
	init.forEach( ( entry ) => {
		if ( globalThis.SCRIPT_DEBUG ) {
			if ( entry.suffix ) {
				warnUniqueIdWithTwoHyphens( 'init', entry.suffix );
			}
		}
		// TODO: Replace with useEffect to prevent unneeded scopes.
		useInit( () => {
			let start;
			if ( globalThis.IS_GUTENBERG_PLUGIN ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					start = performance.now();
				}
			}
			let result = evaluate( entry );
			if ( typeof result === 'function' ) {
				result = result();
			}
			if ( globalThis.IS_GUTENBERG_PLUGIN ) {
				if ( globalThis.SCRIPT_DEBUG ) {
					performance.measure(
						`interactivity api init ${ entry.namespace }`,
						{
							start,
							end: performance.now(),
							detail: {
								devtools: {
									track: `IA: init ${ entry.namespace }`,
								},
							},
						}
					);
				}
			}
			return result;
		} );
	} );
} );
