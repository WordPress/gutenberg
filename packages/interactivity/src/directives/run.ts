import { directive } from '../hooks';
import { warnUniqueIdWithTwoHyphens } from './utils/warnings';

// data-wp-run---[unique-id] — Run expression on render.
directive( 'run', ( { directives: { run }, evaluate } ) => {
	run.forEach( ( entry ) => {
		if ( globalThis.SCRIPT_DEBUG ) {
			if ( entry.suffix ) {
				warnUniqueIdWithTwoHyphens( 'run', entry.suffix );
			}
		}
		let result = evaluate( entry );
		if ( typeof result === 'function' ) {
			result = result();
		}
		return result;
	} );
} );
