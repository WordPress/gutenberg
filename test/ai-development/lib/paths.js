/**
 * The directories the harness has to agree on.
 *
 * The workspace path appears in the sandbox rules, in the permission rules, in
 * `working_dir`, and in the extension that builds it. Resolving it in one place
 * means the boundary and the directory it describes cannot drift apart.
 *
 * Everything here is resolved from this file rather than from the process's
 * working directory, so none of it depends on where a run was started.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libraryDirectory = path.dirname( fileURLToPath( import.meta.url ) );

// Denied to the evaluated agent, and `realpath` because a rule has to name the
// path the operating system resolves to, not a symlink to it.
export const homeDirectory = fs.realpathSync( os.homedir() );

/** The checkout under evaluation. Denied to the agent: it is the answer key. */
export const sourceRoot = path.resolve( libraryDirectory, '../../..' );

/**
 * Where the workspace lives, and a denied read region around it. `realpath`
 * for the same reason as the home directory: on macOS `os.tmpdir()` is a
 * symlink into `/private`.
 */
export const temporaryDirectory = fs.realpathSync( os.tmpdir() );

/**
 * The disposable copy the agents run against.
 *
 * Deliberately outside the checkout. The system temp directory can sit inside
 * the home directory on Windows, so the permission rules omit any denied region
 * that contains this workspace. Sandbox paths are the opposite: the narrower
 * rule wins, which is how the workspace is re-allowed inside denied regions.
 *
 * Keeping it out of the checkout also stops the repository's own lint and test
 * tooling walking into a second copy of the repository.
 */
export const workspace = path.join(
	temporaryDirectory,
	`gutenberg-agent-eval-${ process.pid }`
);

/**
 * A trusted copy of the workspace's Git metadata.
 *
 * The evaluated agent can change `.git`, so host-side Git restores this copy
 * before it stages, inspects, or resets the workspace. Keep it in the denied
 * source checkout rather than beside the workspace: Bash can write to the
 * system temp directory even outside its working directory.
 */
export const trustedGitDirectory = path.join(
	sourceRoot,
	'test/ai-development/results',
	`.trusted-git-${ process.pid }`
);

/**
 * Names the workspace's first commit.
 *
 * The diff and the rollback both compare against it, and neither can use HEAD:
 * an agent may commit its own work, on request or as a checkpoint of its own,
 * and HEAD would move with it. The diff would then come back empty and the
 * rollback would leave the commit in place for every later row.
 */
export const baseTag = 'eval-base';
