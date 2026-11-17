import {
	privateApis as coreDataPrivateApis,
	type CoreDataPrivateApis,
	type ResolvedSelection,
	type SelectionState,
} from '@wordpress/core-data';
import { unlock } from '../../lock-unlock';

const { SelectionType } = unlock( coreDataPrivateApis ) as Pick<
	CoreDataPrivateApis,
	'SelectionType'
>;

/**
 * Reduce any awareness selection shape down to a single resolvable
 * position — whichever end best represents "where this collaborator is."
 * For range selections (SelectionInOneBlock, SelectionInMultipleBlocks) this
 * is the start; a Cursor or WholeBlock selection has only one position.
 *
 * @param selection        - The collaborator's current selection state.
 * @param resolveSelection - Resolver from useResolvedSelection().
 * @return The resolved position, or null if there's nothing to resolve.
 */
export function resolveStartPosition(
	selection: SelectionState | undefined,
	resolveSelection: ( selection: SelectionState ) => ResolvedSelection
): ResolvedSelection | null {
	if ( ! selection ) {
		return null;
	}

	try {
		switch ( selection.type ) {
			case SelectionType.Cursor:
			case SelectionType.WholeBlock:
				return resolveSelection( selection );
			case SelectionType.SelectionInOneBlock:
				return resolveSelection( {
					type: SelectionType.Cursor,
					cursorPosition: selection.cursorStartPosition,
				} );
			case SelectionType.SelectionInMultipleBlocks:
				return resolveSelection( selection.startEndpoint );
			default:
				return null;
		}
	} catch {
		// Selection may reference a stale Yjs position.
		return null;
	}
}
