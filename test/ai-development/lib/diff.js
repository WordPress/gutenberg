/**
 * Appends the agent's actual changes to its response, so assertions grade the
 * workspace rather than the agent's account of it.
 *
 * Running git here rather than inside an agent also keeps git out of the
 * sandbox, where it would need tool permissions and a readable global config.
 *
 * @see https://www.promptfoo.dev/docs/guides/evaluate-coding-agents/
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { baseTag, workspace } from './paths.js';

const execFileAsync = promisify( execFile );

async function git( args ) {
	const { stdout } = await execFileAsync( 'git', args, {
		cwd: workspace,
		maxBuffer: 50 * 1024 * 1024,
	} );
	return stdout.trimEnd();
}

/**
 * Promptfoo transform: takes the agent's response, returns it with the diff.
 *
 * @param {string} output The agent's final text response.
 * @return {Promise<string>} That response, followed by what it actually changed.
 */
export default async function withWorkspaceChanges( output ) {
	// Stage everything first, so files the agent created appear in the diff.
	await git( [ 'add', '--all' ] );

	// All changed filenames against the starting point
	const status = await git( [
		'diff',
		'--cached',
		'--name-status',
		baseTag,
	] );
	// Full diff of the agent's work against the base tag
	const diff = await git( [ 'diff', '--cached', baseTag ] );

	return `${ output }

---

The following is the state of the workspace after the agent finished. It was
read from the repository itself using git, not reported by the agent. Where the agent 
and the following report disagree, the following evidence is the source of truth to 
be trusted.

## Changed files

${ status || '(the agent changed nothing)' }

## Diff

${ diff || '(no diff)' }`;
}
