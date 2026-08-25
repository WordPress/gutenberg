/**
 * Promptfoo lifecycle extension that gives every evaluation row a fresh,
 * writable checkout of the current commit.
 *
 * An agent eval needs somewhere for the agent to work. It cannot be this
 * checkout: the agent edits files, and two rows running at once would collide.
 * So each row gets its own disposable repository built from the committed tree,
 * and the row's `working_dir` points at it.
 *
 * Promptfoo calls this one export for every lifecycle event and passes the
 * event name, so the branches below are `beforeEach` (build), `afterEach`
 * (remove) and `afterAll` (sweep anything a crash left behind).
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
// The repository's own skill-catalog generator, so this cannot drift from it.
import { setupSkills } from '../../../tools/agents/setup-skills.mjs';

const execFileAsync = promisify( execFile );
const libDir = path.dirname( fileURLToPath( import.meta.url ) );
const sourceRoot = path.resolve( libDir, '../../..' );
const activeWorkspaces = new Map();

const gitEnvironment = {
	...process.env,
	GIT_AUTHOR_NAME: 'Gutenberg Agent Eval',
	GIT_AUTHOR_EMAIL: 'gutenberg-agent-eval@example.com',
	GIT_COMMITTER_NAME: 'Gutenberg Agent Eval',
	GIT_COMMITTER_EMAIL: 'gutenberg-agent-eval@example.com',
};

async function git( cwd, args ) {
	return execFileAsync( 'git', args, {
		cwd,
		env: gitEnvironment,
		maxBuffer: 10 * 1024 * 1024,
	} );
}

/**
 * Generates Claude Code's native view of the repository skills.
 *
 * A real checkout gets this from `npm run agents:setup`, which postinstall
 * runs. The generated directory is ignored by Git, so it is absent from the
 * archive, and the workspace never runs npm — without it the repository's
 * skills are inert files that nothing announces to the agent.
 *
 * This calls the repository's own implementation rather than copying what it
 * does, so the workspace cannot drift from what a contributor actually gets.
 *
 * @param {string} workspace Workspace directory.
 */
async function generateNativeSkills( workspace ) {
	try {
		await setupSkills( { repositoryRoot: workspace } );
	} catch ( error ) {
		throw new Error(
			`Could not generate .claude/skills from .agents/skills in the workspace.\n${ error.message }`
		);
	}
}

/**
 * Resolves what a workspace should be built from.
 *
 * A plain run measures what you are working on, uncommitted edits included.
 *
 * Naming a ref means measuring that commit, so a comparison stays a comparison
 * of commits and the working tree cannot leak into a row labelled `trunk`.
 *
 * @param {string} [baseRef] Ref to measure, or undefined for the working tree.
 * @return {Promise<string>} A tree-ish `git archive` can write.
 */
async function resolveTree( baseRef ) {
	if ( baseRef ) {
		return baseRef;
	}

	// `git stash create` writes a commit holding the working tree without
	// touching the index, the stash list, or the checkout. It returns nothing
	// when there is nothing to stash, in which case HEAD is already current.
	const { stdout } = await git( sourceRoot, [ 'stash', 'create' ] );
	return stdout.trim() || 'HEAD';
}

async function createWorkspace( baseRef ) {
	const temporaryRoot = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-agent-eval-' )
	);
	const workspace = path.join( temporaryRoot, 'repository' );
	const archive = path.join( temporaryRoot, 'repository.tar' );

	try {
		await fs.mkdir( workspace );
		await git( sourceRoot, [
			'archive',
			'--format=tar',
			`--output=${ archive }`,
			await resolveTree( baseRef ),
		] );
		await execFileAsync( 'tar', [ '-xf', archive, '-C', workspace ] );
		await fs.unlink( archive );

		// Do not expose the evaluation or its expected behavior to the subject.
		await fs.rm( path.join( workspace, 'test/ai-development' ), {
			recursive: true,
			force: true,
		} );

		await generateNativeSkills( workspace );

		// A repository, not just files: the agent is expected to inspect
		// history, and suites grade what ends up in the working tree.
		await git( workspace, [ 'init', '--quiet' ] );
		await git( workspace, [ 'add', '--all' ] );
		await git( workspace, [
			'commit',
			'--quiet',
			'--message',
			'Eval workspace',
		] );

		activeWorkspaces.set( workspace, temporaryRoot );
		return workspace;
	} catch ( error ) {
		await fs.rm( temporaryRoot, { recursive: true, force: true } );
		throw error;
	}
}

async function cleanupWorkspace( workspace ) {
	const temporaryRoot = activeWorkspaces.get( workspace );
	if ( ! temporaryRoot ) {
		return;
	}

	activeWorkspaces.delete( workspace );
	await fs.rm( temporaryRoot, { recursive: true, force: true } );
}

/**
 * Fills in the parts of a row's configuration that depend on its workspace.
 *
 * The workspace cannot be named in a spec, because it does not exist until the
 * row is about to run and every row gets a different one. So the values that
 * need its path are resolved here: `working_dir` for the agent and for the
 * provider that grades it, and the sandbox's allow and deny paths.
 *
 * Whatever `beforeEach` returns replaces the row, so this hands Promptfoo back
 * the spec's own configuration with those values filled in.
 *
 * @param {Object} context The row Promptfoo is about to run.
 * @return {Promise<Object>} The same row, pointed at a fresh workspace.
 */
async function withWorkspace( context ) {
	const workspace = await createWorkspace();
	const sandbox = context.test.options?.sandbox;
	const gradingProvider = context.test.options?.provider;

	return {
		test: {
			...context.test,
			vars: {
				...context.test.vars,
				__workspace: workspace,
			},
			options: {
				...context.test.options,
				working_dir: workspace,
				...( gradingProvider && typeof gradingProvider === 'object'
					? {
							provider: {
								...gradingProvider,
								config: {
									...gradingProvider.config,
									working_dir: workspace,
								},
							},
					  }
					: {} ),
				...( sandbox
					? {
							sandbox: {
								...sandbox,
								filesystem: {
									...( sandbox.filesystem || {} ),
									allowRead: [ workspace ],
									allowWrite: [ workspace ],
									// allowRead only widens access, so the
									// source checkout — which still holds this
									// eval's assertions — has to be denied
									// explicitly.
									denyRead: [ sourceRoot ],
								},
							},
					  }
					: {} ),
			},
		},
	};
}

/**
 * Promptfoo's lifecycle hook: one export, called once per event with the event
 * name. Every row gets a workspace before it runs and loses it afterwards.
 *
 * @param {string} hookName Lifecycle event Promptfoo is calling.
 * @param {Object} context  The row, including its test case.
 * @return {Promise<Object>} The row Promptfoo should run.
 */
export async function extensionHook( hookName, context ) {
	if ( hookName === 'beforeEach' ) {
		return withWorkspace( context );
	}

	if ( hookName === 'afterEach' ) {
		await cleanupWorkspace( context.test.options?.working_dir );
		return context;
	}

	if ( hookName === 'afterAll' ) {
		await Promise.all(
			[ ...activeWorkspaces.keys() ].map( cleanupWorkspace )
		);
	}

	return context;
}
