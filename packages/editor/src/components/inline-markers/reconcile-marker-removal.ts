/**
 * Decide what to do with an anchored inline marker based on whether its
 * in-content marker is still present. Pure so it can be unit-tested without
 * React/stores.
 *
 * - `'anchor'`: the marker is present; the caller should record that it has
 *   been seen this session.
 * - `'delete'`: the marker was seen earlier this session but is now gone (the
 *   user removed the marked text), so the linked record should be deleted.
 * - `'skip'`: the marker can't be evaluated (not an inline marker, block not
 *   loaded yet) or is absent for a marker never observed this session (e.g. a
 *   legacy/never-anchored record), which keeps any fallback rather than being
 *   deleted.
 *
 * The session `Set` guard is what distinguishes a genuine removal (seen, now
 * gone) from content that simply has not loaded its marker yet.
 *
 * @param markerPresent Whether the marker was found in content; null/undefined when undeterminable.
 * @param id            Stable marker id, used as the key in `anchored`.
 * @param anchored      Ids whose marker has been observed present this session.
 * @return The action to take.
 */
export function reconcileMarkerRemoval(
	markerPresent: boolean | null | undefined,
	id: any,
	anchored: Set< any >
): 'anchor' | 'delete' | 'skip' {
	if ( markerPresent === null || markerPresent === undefined ) {
		return 'skip';
	}
	if ( markerPresent ) {
		return 'anchor';
	}
	return anchored.has( id ) ? 'delete' : 'skip';
}
