/**
 * Promptfoo lifecycle extension that gives every evaluation row a fresh,
 * writable checkout of the current commit.
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
		// Failing loudly matters here: a workspace without the generated view
		// still runs, and every suite would report an agent ignoring guidance
		// it was never offered.
		throw new Error(
			`Could not generate .claude/skills from .agents/skills in the workspace.\n${ error.message }`
		);
	}
}

/**
 * Resolves a row's base ref, so a moving branch cannot shift underneath a run
 * and an unknown ref fails with a usable message.
 *
 * @param {string} baseRef Branch, tag or commit the workspace is built from.
 * @return {Promise<string>} Resolved commit SHA.
 */
async function resolveBaseRef( baseRef ) {
	try {
		const { stdout } = await git( sourceRoot, [
			'rev-parse',
			'--verify',
			`${ baseRef }^{commit}`,
		] );
		return stdout.trim();
	} catch {
		throw new Error(
			`Ref not found: ${ baseRef }. Use a branch, tag or commit that exists in this checkout.`
		);
	}
}

async function createWorkspace( baseCommit ) {
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
			baseCommit,
		] );
		await execFileAsync( 'tar', [ '-xf', archive, '-C', workspace ] );
		await fs.unlink( archive );

		// Do not expose the evaluation or its expected behavior to the subject.
		await fs.rm( path.join( workspace, 'test/ai-development' ), {
			recursive: true,
			force: true,
		} );

		await generateNativeSkills( workspace );

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
	for ( let attempt = 1; attempt <= 5; attempt++ ) {
		try {
			await fs.rm( temporaryRoot, { recursive: true, force: true } );
			return;
		} catch ( error ) {
			if ( attempt === 5 ) {
				throw error;
			}
			// Docker Desktop can leave deny-delete ACLs on bind-mounted
			// directories after wp-env stops.
			if ( process.platform === 'darwin' ) {
				await execFileAsync( 'chmod', [ '-RN', temporaryRoot ] ).catch(
					() => undefined
				);
			}
			await new Promise( ( resolve ) =>
				setTimeout( resolve, attempt * 250 )
			);
		}
	}
}

export async function extensionHook( hookName, context ) {
	if ( hookName === 'beforeEach' ) {
		const workspace = await createWorkspace(
			await resolveBaseRef( context.test.vars?.baseRef || 'HEAD' )
		);
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
										// source checkout — which still holds
										// this eval's assertions — has to be
										// denied explicitly.
										denyRead: [ sourceRoot ],
									},
								},
						  }
						: {} ),
				},
			},
		};
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
