import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';

const SOURCE_SKILLS_DIRECTORY = '.agents/skills';
const TARGET_SKILLS_DIRECTORY = '.claude/skills';

/**
 * Generates Claude Code's repository skill directory.
 *
 * @param {Object}   options                Setup options.
 * @param {string}   options.repositoryRoot Repository root directory.
 * @param {Function} [options.confirm]      Confirms removing unmatched skill entries.
 * @param {boolean}  [options.ifSafe]       Replaces skills only without unmatched entries.
 * @return {Promise<boolean>} Whether the skill directory was generated.
 */
export async function setupSkills( {
	repositoryRoot,
	confirm = () => true,
	ifSafe = false,
} ) {
	const target = path.join( repositoryRoot, TARGET_SKILLS_DIRECTORY );
	const source = path.join( repositoryRoot, SOURCE_SKILLS_DIRECTORY );
	const unmatchedEntries = await getUnmatchedEntries( source, target );

	if ( ifSafe && unmatchedEntries.length ) {
		return false;
	}

	if ( unmatchedEntries.length && ! ( await confirm( unmatchedEntries ) ) ) {
		return false;
	}

	await rm( target, { recursive: true, force: true } );
	await mkdir( path.dirname( target ), { recursive: true } );
	await cp( source, target, { recursive: true } );
	return true;
}
async function getUnmatchedEntries( source, target ) {
	const sourceEntries = await readdir( source );
	let targetEntries;

	try {
		targetEntries = await readdir( target );
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			return [];
		}

		throw error;
	}

	const sourceEntryNames = new Set( sourceEntries );
	return targetEntries
		.filter( ( entry ) => ! sourceEntryNames.has( entry ) )
		.sort();
}

async function confirmReplacement( unmatchedEntries ) {
	if ( ! process.stdin.isTTY ) {
		throw new Error(
			`Cannot replace ${ TARGET_SKILLS_DIRECTORY } non-interactively because it contains unmatched entries: ${ unmatchedEntries.join(
				', '
			) }.`
		);
	}

	const readline = createInterface( {
		input: process.stdin,
		output: process.stdout,
	} );
	try {
		const answer = await readline.question(
			`The following ${ TARGET_SKILLS_DIRECTORY } entries are not in ${ SOURCE_SKILLS_DIRECTORY } and will be removed:\n${ unmatchedEntries
				.map( ( entry ) => `- ${ entry }` )
				.join( '\n' ) }\nContinue? [y/N] `
		);
		return [ 'y', 'yes' ].includes( answer.trim().toLowerCase() );
	} finally {
		readline.close();
	}
}

async function runSetupSkills() {
	const ifSafe = process.argv.includes( '--if-safe' );
	const generated = await setupSkills( {
		repositoryRoot: process.cwd(),
		confirm: confirmReplacement,
		ifSafe,
	} );
	if ( ! generated ) {
		if ( ifSafe ) {
			console.log(
				`Skipped: ${ TARGET_SKILLS_DIRECTORY } contains entries that are not in ${ SOURCE_SKILLS_DIRECTORY }. Run npm run agents:setup to apply skill catalog changes.`
			);
			return;
		}

		console.log( 'Cancelled.' );
		process.exitCode = 1;
		return;
	}

	console.log( `Generated: ${ TARGET_SKILLS_DIRECTORY }` );
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( process.argv[ 1 ] ).href
) {
	runSetupSkills().catch( ( error ) => {
		console.error( error.message );
		process.exitCode = 1;
	} );
}
