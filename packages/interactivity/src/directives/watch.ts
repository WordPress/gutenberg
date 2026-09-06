import { directive } from '../hooks';
import { useWatch } from '../utils';
import { warnUniqueIdWithTwoHyphens } from './utils/warnings';

// data-wp-watch---[unique-id] — Reactive effect.
directive( 'watch', ( { directives: { watch }, evaluate } ) => {
	watch.forEach( ( entry ) => {
		if ( globalThis.SCRIPT_DEBUG ) {
			if ( entry.suffix ) {
				warnUniqueIdWithTwoHyphens( 'watch', entry.suffix );
			}
		}
		useWatch( () => {
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
						`interactivity api watch ${ entry.namespace }`,
						{
							start,
							end: performance.now(),
							detail: {
								devtools: {
									track: `IA: watch ${ entry.namespace }`,
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
