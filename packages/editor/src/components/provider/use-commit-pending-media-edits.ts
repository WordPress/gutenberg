import { useRegistry } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

type SaveRecord = Record< string, unknown >;

interface SaveContext {
	kind: string;
	name: string;
	recordId?: string | number;
}

/**
 * Commits an entity's pending media edits whenever it's saved, so they're
 * saved by any editor save, such as the site editor's save panel. `savePost`
 * commits the current post's edits itself before reading its content.
 */
export default function useCommitPendingMediaEdits() {
	const registry = useRegistry();

	useEffect( () => {
		const core = unlock( registry.dispatch( coreStore ) );

		async function handler(
			record: SaveRecord,
			{ kind, name, recordId }: SaveContext
		): Promise< SaveRecord > {
			if ( kind !== 'postType' || recordId === undefined ) {
				return record;
			}
			const entity = { kind, name, id: recordId };
			const editor = unlock( registry.select( editorStore ) );
			if (
				! Object.keys( editor.getPendingMediaEdits( entity ) ).length
			) {
				return record;
			}
			const error = await unlock(
				registry.dispatch( editorStore )
			).commitPendingMediaEdits( entity );
			if ( error ) {
				throw new Error( error.message );
			}
			// The commit changes the entity's blocks, so its content has to
			// be saved again.
			return {
				...record,
				...registry
					.select( coreStore )
					.getEntityRecordNonTransientEdits( kind, name, recordId ),
			};
		}

		core.addPreSaveHandler( handler );
		return () => core.removePreSaveHandler( handler );
	}, [ registry ] );
}
