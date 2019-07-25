// TODO: Unit tests.

/**
 * With equivalent usage to Object.assign, merges source objects into the target
 * using property descriptors in order to respect properties which are not
 * enumerable.
 *
 * @param {Object}    target  Target on which to assign property descriptors.
 * @param {...Object} sources One or more source objects from which to assign.
 *
 * @return {Object} Merged object.
 */
function assignPropertyDescriptors( target, ...sources ) {
	for ( let i = sources.length - 1; i >= 0; i-- ) {
		const source = sources[ i ];
		if ( source === undefined ) {
			continue;
		}

		const descriptors = Object.getOwnPropertyDescriptors( source );
		for ( const [ key, descriptor ] of Object.entries( descriptors ) ) {
			// The property cannot be redefined, so iteration occurs in reverse
			// and defines only if not already set by a "later" source.
			if ( ! target.hasOwnProperty( key ) ) {
				Object.defineProperty( target, key, descriptor );
			}
		}
	}

	return target;
}

export default assignPropertyDescriptors;
