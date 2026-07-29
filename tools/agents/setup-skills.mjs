import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE_SKILLS_DIRECTORY = '.agents/skills';
const TARGET_SKILLS_DIRECTORY = '.claude/skills';

/**
 * Generates Claude Code's repository skill directory.
 *
 * @param {Object} options                Setup options.
 * @param {string} options.repositoryRoot Repository root directory.
 */
export async function setupSkills( { repositoryRoot } ) {
	const source = path.join( repositoryRoot, SOURCE_SKILLS_DIRECTORY );
	const target = path.join( repositoryRoot, TARGET_SKILLS_DIRECTORY );

	await rm( target, { recursive: true, force: true } );
	await mkdir( path.dirname( target ), { recursive: true } );
	await cp( source, target, { recursive: true } );
}

async function runSetupSkills() {
	await setupSkills( { repositoryRoot: process.cwd() } );
	console.log( `Generated: ${ TARGET_SKILLS_DIRECTORY }` );
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( process.argv[ 1 ] ).href
) {
	runSetupSkills();
}
