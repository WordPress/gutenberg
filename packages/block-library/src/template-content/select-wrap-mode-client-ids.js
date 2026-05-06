/**
 * Computes the client-id buckets that wrap-mode locking needs from the
 * block-editor store, given the client id of the `core/template-content`
 * block.
 *
 * Categorisation is relative to template-content (which can be nested
 * anywhere inside `root.html`):
 *
 *   - `ancestorClientIds` — the chain of containers that wrap template-
 *     content. They can't be marked `'disabled'` (would propagate to
 *     template-content) so they're locked to `'contentOnly'`.
 *   - `innerChildClientIds` — direct children of template-content. The
 *     inner template's blocks live here and stay editable.
 *   - `chromeTopClientIds` — siblings of any ancestor (or of template-
 *     content itself) that aren't part of the ancestor chain. Locked to
 *     `'contentOnly'` so the user can select them.
 *   - `chromeDescendantClientIds` — everything beneath a chrome top.
 *     Locked to `'disabled'` (inert) so clicks bubble up to chrome top.
 *
 * Pure: takes selectors as a parameter so it can be unit tested.
 *
 * @param {Object}      blockEditorSelectors Object exposing the
 *                                           `getBlockOrder`,
 *                                           `getBlockParents`, and
 *                                           `getClientIdsOfDescendants`
 *                                           selectors.
 * @param {string|null} clientId             The template-content block's id.
 */
export function selectWrapModeClientIds( blockEditorSelectors, clientId ) {
	if ( ! clientId ) {
		return {
			ancestorClientIds: [],
			innerChildClientIds: [],
			chromeTopClientIds: [],
			chromeDescendantClientIds: [],
		};
	}
	const { getBlockOrder, getBlockParents, getClientIdsOfDescendants } =
		blockEditorSelectors;
	const ancestorClientIds = getBlockParents( clientId );
	const ancestorSet = new Set( [ ...ancestorClientIds, clientId ] );
	const containerLookups = [ '', ...ancestorClientIds ];
	const chromeTopClientIds = [];
	for ( const containerId of containerLookups ) {
		for ( const childId of getBlockOrder( containerId ) ) {
			if ( ! ancestorSet.has( childId ) ) {
				chromeTopClientIds.push( childId );
			}
		}
	}
	return {
		ancestorClientIds,
		innerChildClientIds: getBlockOrder( clientId ),
		chromeTopClientIds,
		chromeDescendantClientIds:
			chromeTopClientIds.length > 0
				? getClientIdsOfDescendants( chromeTopClientIds )
				: [],
	};
}
