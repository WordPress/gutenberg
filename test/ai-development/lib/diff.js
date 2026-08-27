/**
 * Appends the agent's actual changes to its response, so assertions grade the
 * workspace rather than the agent's account of it.
 *
 * Promptfoo's coding-agent guide is explicit that an agent's output "is its
 * final text response describing what it did, not the file contents", and that
 * file-level verification means reading the files after the eval. This is that
 * read, at the one moment it is safe to take.
 *
 * Promptfoo applies a transform in `transformRunEvalResponse`, immediately
 * after the provider returns and before any assertion is graded or queued. That
 * matters: a model-graded assertion defers grading onto a queue, so a grader
 * that inspected the workspace itself would be racing the `afterEach` rollback
 * for the state it is judging. Reading here cannot race anything.
 *
 * It also takes git out of the sandbox. Run from the harness rather than by an
 * agent, it needs no tool permissions and no readable global config.
 *
 * @see https://www.promptfoo.dev/docs/guides/evaluate-coding-agents/
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { workspace } from './paths.js';

const execFileAsync = promisify( execFile );

// Enough for a focused change, and short of what would crowd out the rubric.
// A run that blows past this has usually gone wrong in a way worth seeing.
const MAXIMUM_DIFF_LENGTH = 60000;

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
	// Untracked files are invisible to `git diff` alone, and a new test file is
	// exactly what these evaluations are usually grading. The index is
	// disposable: `afterEach` rolls the whole workspace back.
	await git( [ 'add', '--all' ] );

	const status = await git( [ 'status', '--porcelain' ] );
	let diff = await git( [ 'diff', '--cached' ] );

	if ( diff.length > MAXIMUM_DIFF_LENGTH ) {
		diff =
			diff.slice( 0, MAXIMUM_DIFF_LENGTH ) +
			`\n\n[Diff truncated at ${ MAXIMUM_DIFF_LENGTH } characters.]`;
	}

	return `${ output }

---

The following is the state of the workspace after the agent finished. It was
read from the repository itself, not reported by the agent, so it is what
actually happened rather than what the agent claims happened. Where the two
disagree, this is the evidence.

## Changed files

${ status || '(the agent changed nothing)' }

## Diff

${ diff || '(no diff)' }`;
}
