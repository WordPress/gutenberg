/**
 * Adapts the notes feed produced by `useNoteThreads` into the canonical
 * document-annotation item shape consumed by `<PanelItem>`. See the
 * directory README for the full contract.
 *
 * @param {Array} notes Notes returned by `useNoteThreads`.
 * @return {Array} Items tagged with `kind: 'note'`.
 */
export function useNoteItems( notes ) {
	if ( ! Array.isArray( notes ) || notes.length === 0 ) {
		return [];
	}
	return notes.map( ( note ) => ( {
		kind: 'note',
		id: note.id,
		blockClientId: note.blockClientId,
		note,
	} ) );
}
