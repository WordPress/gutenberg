/**
 * Promptfoo lifecycle extension that gives the run a disposable checkout.
 *
 * An agent eval needs somewhere for the agent to work, and it cannot be this
 * checkout: the agent edits files, and the suites grade what it left behind.
 * So the run builds one copy of the repository, every row works in it, and each
 * row starts from the same state because the row before it was rolled back.
 *
 * Rolling back rather than rebuilding is what makes a single workspace
 * practical — archiving Gutenberg once per run is affordable, once per row is
 * not. It is also why rows must not overlap: `evaluateOptions.maxConcurrency`
 * is 1 in `base.js`, and raising it would let one row reset another's work.
 *
 * This is Promptfoo's documented shape for an agent with side effects — serial
 * execution, a fixed working directory, Git to restore it between rows. See
 * `examples/claude-agent-sdk/advanced` in the Promptfoo repository.
 *
 * Promptfoo calls this one export for every lifecycle event and passes the
 * event name, so the branches below are `beforeAll` (build), `afterEach`
 * (roll back) and `afterAll` (remove). Returning nothing leaves the run
 * untouched; throwing aborts it, which is what a workspace that cannot be
 * built should do.
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
// The repository's own skill-catalog generator, so this cannot drift from it.
import { setupSkills } from '../../../tools/agents/setup-skills.mjs';
import { baseTag, sourceRoot, workspace } from './paths.js';

const execFileAsync = promisify( execFile );

const gitEnvironment = {
	...process.env,
	GIT_AUTHOR_NAME: 'Gutenberg Agent Eval',
	GIT_AUTHOR_EMAIL: 'gutenberg-agent-eval@example.com',
	GIT_COMMITTER_NAME: 'Gutenberg Agent Eval',
	GIT_COMMITTER_EMAIL: 'gutenberg-agent-eval@example.com',
};

async function git( cwd, args ) {
	try {
		return await execFileAsync( 'git', args, {
			cwd,
			env: gitEnvironment,
			maxBuffer: 10 * 1024 * 1024,
		} );
	} catch ( error ) {
		// `execFile` reports only the command it ran, and Promptfoo then wraps
		// that again, so a failure arrives with nothing to act on. Say what Git
		// said, and where.
		throw new Error(
			`git ${ args.join( ' ' ) } failed in ${ cwd } (exit ${
				error.code
			})\n${ error.stderr || '(no output)' }`
		);
	}
}

/**
 * Resolves what the workspace is built from: what you are working on,
 * uncommitted edits included.
 *
 * `git stash create` writes a commit holding the working tree without touching
 * the stash list or the checkout. It returns nothing when there is nothing to
 * stash, in which case HEAD is already current.
 *
 * @return {Promise<string>} A tree-ish `git archive` can write.
 */
async function resolveTree() {
	// `git stash create` fails, with nothing on either stream, when there is
	// nothing to stash. Ask first rather than reading that failure as one.
	// `--untracked-files=no` because `stash create` ignores untracked files, so
	// a tree holding only those has nothing to stash either.
	const { stdout: modified } = await git( sourceRoot, [
		'status',
		'--porcelain',
		'--untracked-files=no',
	] );

	if ( ! modified.trim() ) {
		return 'HEAD';
	}

	const { stdout } = await git( sourceRoot, [ 'stash', 'create' ] );
	return stdout.trim() || 'HEAD';
}

/**
 * Builds the workspace, replacing anything a previous run left behind.
 */
async function createWorkspace() {
	await removeWorkspace();
	await fs.mkdir( workspace, { recursive: true } );

	const archive = `${ workspace }.tar`;

	try {
		await git( sourceRoot, [
			'archive',
			'--format=tar',
			`--output=${ archive }`,
			await resolveTree(),
		] );
		await execFileAsync( 'tar', [ '-xf', archive, '-C', workspace ] );
	} finally {
		await fs.rm( archive, { force: true } );
	}

	// Do not expose the evaluation or its expected behavior to the subject.
	await fs.rm( path.join( workspace, 'test/ai-development' ), {
		recursive: true,
		force: true,
	} );

	// A real checkout gets `.claude/skills` from `npm run agents:setup`. It is
	// ignored by Git, so it is absent from the archive, and the workspace never
	// runs npm — without it the repository's skills are inert files that
	// nothing announces to the agent.
	await setupSkills( { repositoryRoot: workspace } );

	// A repository, not just files: the agent is expected to inspect history,
	// the suites grade what ends up in the working tree, and `afterEach` needs
	// a commit to roll back to.
	await git( workspace, [ 'init', '--quiet' ] );
	await git( workspace, [ 'add', '--all' ] );
	await git( workspace, [
		'commit',
		'--quiet',
		'--message',
		'Eval workspace',
	] );
	// Both the diff and the rollback compare against this tag rather than HEAD;
	// see `baseTag` in `paths.js`.
	await git( workspace, [ 'tag', baseTag ] );
}

/**
 * Returns the workspace to the state the row before it started from.
 *
 * `clean` deliberately omits `-x`: the generated `.claude/skills` is ignored by
 * Git, and removing it would leave every later row without the repository's
 * skills.
 */
async function resetWorkspace() {
	await git( workspace, [ 'reset', '--quiet', '--hard', baseTag ] );
	await git( workspace, [ 'clean', '--quiet', '-fd' ] );
}

async function removeWorkspace() {
	await fs.rm( workspace, { recursive: true, force: true } );
}

/**
 * Promptfoo's lifecycle hook: one export, called once per event with the event
 * name.
 *
 * @param {string} hookName Lifecycle event Promptfoo is calling.
 */
export async function extensionHook( hookName ) {
	if ( hookName === 'beforeAll' ) {
		await createWorkspace();
	}

	if ( hookName === 'afterEach' ) {
		await resetWorkspace();
	}

	if ( hookName === 'afterAll' ) {
		await removeWorkspace();
	}
}
