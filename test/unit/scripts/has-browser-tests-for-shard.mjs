import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseSequencer } from 'vitest/node';
import testMigration from '../test-migration.json' with { type: 'json' };
import {
	discoverTestFiles,
	getVitestTestsByProject,
} from './discover-test-files.mjs';

const ROOT_DIR = path.resolve(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../../..'
);
const shardMatch = /^(\d+)\/(\d+)$/.exec( process.argv[ 2 ] ?? '' );

if ( ! shardMatch ) {
	throw new Error( 'Expected a shard in the format <index>/<count>.' );
}

const shard = {
	index: Number( shardMatch[ 1 ] ),
	count: Number( shardMatch[ 2 ] ),
};
const testsByProject = getVitestTestsByProject(
	discoverTestFiles( ROOT_DIR ),
	testMigration
);
const specifications = Object.entries( testsByProject ).flatMap(
	( [ projectName, testPaths ] ) =>
		testPaths.map( ( testPath ) => ( {
			moduleId: path.resolve( ROOT_DIR, testPath ),
			projectName,
		} ) )
);
const sequencer = new BaseSequencer( {
	config: { root: ROOT_DIR, shard },
} );
const shardedSpecifications = await sequencer.shard( specifications );

process.stdout.write(
	String(
		shardedSpecifications.some(
			( specification ) => specification.projectName === 'browser'
		)
	)
);
