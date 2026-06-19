/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * Returns a copy of `edits` where any value equal to its persisted counterpart
 * is set to `undefined`. The edits reducer treats `undefined` as a signal to
 * drop the edit, so the property is no longer considered dirty.
 *
 * @param edits           Edits keyed by property name.
 * @param persistedRecord Persisted entity record to compare against.
 *
 * @return Edits with unchanged properties set to `undefined`.
 */
export default function clearUnchangedEdits(
	edits: Record< string, unknown >,
	persistedRecord: Record< string, any > | undefined
): Record< string, unknown > {
	if ( ! persistedRecord ) {
		return edits;
	}

	return Object.fromEntries(
		Object.entries( edits ).map( ( [ key, value ] ) => {
			const persisted =
				persistedRecord[ key ]?.raw ?? persistedRecord[ key ];
			return [
				key,
				fastDeepEqual( value, persisted ) ? undefined : value,
			];
		} )
	);
}
