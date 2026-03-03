/**
 * Returns a copy of `query` filtered to only the keys that affect resolution
 * identity (`context` and `_fields`), or `undefined` when none are present.
 * This mirrors the normalisation that the data store applies when keying
 * resolved records, so that `finishResolutions` receives args that match the
 * keys used by callers who omit pagination params.
 *
 * @param {Object} query The raw query object.
 * @return {Object|undefined} Normalised query or undefined.
 */
export default function normalizeQueryForResolution( query ) {
	if ( ! query ) {
		return undefined;
	}

	const filtered = Object.fromEntries(
		Object.entries( query ).filter(
			( [ k, v ] ) => ( k === 'context' || k === '_fields' ) && !! v
		)
	);
	return Object.keys( filtered ).length > 0 ? filtered : undefined;
}
