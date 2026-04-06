/**
 * WordPress dependencies
 */
import { type CRDTDoc, type MigrationResult } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import {
	CRDT_DOC_VERSION,
	CRDT_STATE_MAP_KEY,
	CRDT_STATE_MAP_VERSION_KEY,
} from '../../sync';
import { v2MigrateTableCellContent } from './v2-table-cell-content';

export type { MigrationResult };

type MigrationFn = ( ydoc: CRDTDoc ) => MigrationResult;

/**
 * Registry of migrations. Each entry maps a target version to the migration
 * function that brings the document up to that version. Migrations run
 * sequentially in version order.
 *
 * To add a new migration:
 * 1. Increment CRDT_DOC_VERSION in packages/sync/src/config.ts
 * 2. Create a new file: crdt-migrations/v<version>-<description>.ts
 * 3. Append to this array: { version: <new version>, migrate: <function> }
 * 4. Add tests in test/crdt-migrations.ts
 *
 * For a breaking change (non-migrateable), the migration can return
 * 'incompatible'. The persisted doc will be discarded and rebuilt
 * from the database record.
 */
const migrations: Array< { version: number; migrate: MigrationFn } > = [
	{ version: 2, migrate: v2MigrateTableCellContent },
];

/**
 * Run migrations on a persisted CRDT document to bring it up to the current
 * schema version.
 *
 * This is a simple version check when the document is already current. When
 * migrations are needed, they run sequentially and the version is updated in
 * the state map so they only run once per document lifetime.
 *
 * @param ydoc The deserialized persisted CRDT document.
 * @return The overall migration result.
 */
export function migrateCRDTDoc( ydoc: CRDTDoc ): MigrationResult {
	const stateMap = ydoc.getMap( CRDT_STATE_MAP_KEY );
	const docVersion =
		( stateMap.get( CRDT_STATE_MAP_VERSION_KEY ) as number ) ?? 0;

	if ( docVersion >= CRDT_DOC_VERSION ) {
		return 'clean';
	}

	let didMigrate = false;
	let incompatible = false;

	// Defensive sort to ensure migrations always run in version order,
	// regardless of how they are ordered in the registry array.
	const sortedMigrations = [ ...migrations ].sort(
		( a, b ) => a.version - b.version
	);

	// Run all migrations and the version bump inside a single transaction
	// so Yjs batches every set() call into one update event.
	ydoc.transact( () => {
		for ( const { version, migrate } of sortedMigrations ) {
			if ( version <= docVersion ) {
				continue;
			}

			const result = migrate( ydoc );

			if ( result === 'incompatible' ) {
				incompatible = true;
				return;
			}

			if ( result === 'migrated' ) {
				didMigrate = true;
			}
		}

		// Update the version so these migrations don't run again.
		stateMap.set( CRDT_STATE_MAP_VERSION_KEY, CRDT_DOC_VERSION );
	} );

	if ( incompatible ) {
		return 'incompatible';
	}

	return didMigrate ? 'migrated' : 'clean';
}
