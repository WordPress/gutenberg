import { directive } from '../hooks';
import { useWatch } from '../utils';
import { warnSuffixNotSupported } from './utils/warnings';

// data-wp-watch---[unique-id] — Reactive effect; suffixes are unsupported.
directive( 'watch', ( { directives: { watch }, evaluate } ) => {
	watch.forEach( ( entry ) => {
		if ( entry.suffix !== null ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnSuffixNotSupported( 'watch', entry.suffix );
			}
			return;
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
