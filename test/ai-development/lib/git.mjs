/**
 * Trusted Git operations for the evaluation workspace.
 *
 * The evaluated agent can change repository-local Git config and attributes.
 * Before the harness runs Git on the host, it replaces `.git` with the copy
 * captured when the workspace was created. Global and system configuration is
 * disabled as well, so a working-tree attribute cannot reach an executable
 * filter supplied from outside that trusted metadata.
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { trustedGitDirectory, workspace } from './paths.js';

const execFileAsync = promisify( execFile );
// Git for Windows accepts the DOS device name, but not Node's `\\.\nul` path.
const gitNullDevice = process.platform === 'win32' ? 'NUL' : '/dev/null';

const inheritedEnvironment = Object.fromEntries(
	Object.entries( process.env ).filter(
		( [ name ] ) =>
			! name.startsWith( 'GIT_CONFIG_' ) &&
			! [
				'GIT_ALTERNATE_OBJECT_DIRECTORIES',
				'GIT_COMMON_DIR',
				'GIT_DIR',
				'GIT_INDEX_FILE',
				'GIT_OBJECT_DIRECTORY',
				'GIT_WORK_TREE',
			].includes( name )
	)
);

export const gitEnvironment = {
	...inheritedEnvironment,
	GIT_ATTR_NOSYSTEM: '1',
	GIT_CONFIG_GLOBAL: gitNullDevice,
	GIT_CONFIG_NOSYSTEM: '1',
	GIT_AUTHOR_NAME: 'Gutenberg Agent Eval',
	GIT_AUTHOR_EMAIL: 'gutenberg-agent-eval@example.com',
	GIT_COMMITTER_NAME: 'Gutenberg Agent Eval',
	GIT_COMMITTER_EMAIL: 'gutenberg-agent-eval@example.com',
};

export async function git( cwd, args, maxBuffer = 10 * 1024 * 1024 ) {
	try {
		return await execFileAsync(
			'git',
			[
				'-c',
				`core.hooksPath=${ gitNullDevice }`,
				'-c',
				'gc.auto=0',
				'-c',
				'maintenance.auto=0',
				...args,
			],
			{
				cwd,
				env: gitEnvironment,
				maxBuffer,
			}
		);
	} catch ( error ) {
		// `execFile` reports only the command it ran, and Promptfoo then wraps
		// that again. Include Git's output and the directory in the first error.
		throw new Error(
			`git ${ args.join( ' ' ) } failed in ${ cwd } (exit ${
				error.code
			})\n${ error.stderr || '(no output)' }`
		);
	}
}

export async function saveTrustedGitMetadata() {
	await fs.rm( trustedGitDirectory, { recursive: true, force: true } );
	await fs.mkdir( path.dirname( trustedGitDirectory ), { recursive: true } );
	await fs.cp( path.join( workspace, '.git' ), trustedGitDirectory, {
		recursive: true,
	} );
}

export async function restoreTrustedGitMetadata() {
	await fs.rm( path.join( workspace, '.git' ), {
		recursive: true,
		force: true,
	} );
	await fs.cp( trustedGitDirectory, path.join( workspace, '.git' ), {
		recursive: true,
	} );
}
