import { directive, isDefaultDirectiveSuffix } from '../hooks';
import { warn } from '../utils';
import { PENDING_GETTER } from '../proxies/state';
import { warnUniqueIdNotSupported } from './utils/warnings';

// data-wp-text — Text content binding.
directive( 'text', ( { directives: { text }, element, evaluate } ) => {
	const entries = text.filter( isDefaultDirectiveSuffix );
	// Doesn't do anything if there are no default entries.
	if ( ! entries.length ) {
		if ( globalThis.SCRIPT_DEBUG ) {
			warn(
				'The usage of data-wp-text--suffix is not supported. Please use data-wp-text instead.'
			);
		}
		return;
	}
	entries.forEach( ( entry ) => {
		if ( entry.uniqueId ) {
			if ( globalThis.SCRIPT_DEBUG ) {
				warnUniqueIdNotSupported( 'text', entry.uniqueId );
			}
			return;
		}
		try {
			let result = evaluate( entry );
			if ( result === PENDING_GETTER ) {
				return;
			}
			if ( typeof result === 'function' ) {
				result = result();
			}
			element.props.children =
				typeof result === 'object' ? null : result.toString();
		} catch {
			element.props.children = null;
		}
	} );
} );
