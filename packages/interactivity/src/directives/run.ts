import { directive } from '../hooks';
import { warnSuffixNotSupported } from './utils/warnings';

// data-wp-run---[unique-id] — Run on render; suffixes are unsupported.
directive( 'run', ( { directives: { run }, evaluate } ) => {
	run.forEach( ( entry ) => {
		if ( entry.suffix !== null ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnSuffixNotSupported( 'run', entry.suffix );
			}
			return;
		}
		let result = evaluate( entry );
		if ( typeof result === 'function' ) {
			result = result();
		}
		return result;
	} );
} );
