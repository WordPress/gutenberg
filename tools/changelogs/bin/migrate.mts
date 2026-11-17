#!/usr/bin/env node
import { parseArgs } from 'node:util';
import path from 'node:path';
import {
	migratePackageToChangie,
	rollbackPackageFromChangie,
} from '../lib/migrate.ts';

const REPO_ROOT = path.resolve( import.meta.dirname, '../../..' );

const options = parseArgs( {
	options: {
		package: { type: 'string', short: 'p' },
		rollback: { type: 'boolean', default: false },
		update: { type: 'boolean', default: false },
		'dry-run': { type: 'boolean', default: false },
	},
	allowPositionals: true,
} );

const packageName = options.values.package || options.positionals[ 0 ];
if ( ! packageName ) {
	console.error(
		'Usage: node tools/changelogs/bin/migrate.mjs <package-name> [--update] [--rollback] [--dry-run]'
	);
	process.exit( 1 );
}

const dryRun = options.values[ 'dry-run' ] || false;
const isRollback = options.values.rollback || false;
const isUpdate = options.values.update || false;

if ( isRollback && isUpdate ) {
	console.error( 'Error: --rollback and --update cannot be used together.' );
	process.exit( 1 );
}

try {
	if ( isRollback ) {
		const res = rollbackPackageFromChangie(
			packageName,
			REPO_ROOT,
			dryRun
		);
		if ( dryRun ) {
			console.log(
				`Dry-run rollback complete for ${ res.packageName }: would restore ${ res.versionsRestored } versions and ${ res.fragmentsRestored } unreleased entries.`
			);
		} else {
			console.log(
				`Rollback complete for ${ res.packageName }: restored ${ res.versionsRestored } versions and ${ res.fragmentsRestored } unreleased entries.`
			);
		}
	} else {
		const res = migratePackageToChangie(
			packageName,
			REPO_ROOT,
			dryRun,
			isUpdate
		);
		const actionWord = isUpdate ? 'Update' : 'Migration';
		if ( res.operations.length === 0 ) {
			console.log( 'Nothing to migrate.' );
		} else if ( dryRun ) {
			console.log(
				`Dry-run ${ actionWord.toLowerCase() } complete for ${ res.packageName }: would create ${ res.versionsCreated } version files and ${ res.fragmentsCreated } unreleased fragments.`
			);
		} else {
			console.log(
				`${ actionWord } complete for ${ res.packageName }: created ${ res.versionsCreated } version files and ${ res.fragmentsCreated } unreleased fragments.`
			);
		}
	}
} catch ( err: any ) {
	console.error( `Error: ${ err.message }` );
	process.exit( 1 );
}
