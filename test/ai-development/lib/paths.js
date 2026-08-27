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
 * The disposable copy the agents run against.
 *
 * Deliberately outside both the checkout and the home directory. Permission
 * rules resolve deny before allow and ignore specificity, so a workspace inside
 * a denied directory could not be re-allowed — the rules meant to keep the
 * agent out of the checkout would keep it out of its own working directory too.
 *
 * Keeping it out of the checkout also stops the repository's own lint and test
 * tooling walking into a second copy of the repository.
 */
export const workspace = path.join(
	fs.realpathSync( os.tmpdir() ),
	'gutenberg-agent-eval'
);
