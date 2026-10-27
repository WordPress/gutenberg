/**
 * The files and directories that make up the Gutenberg plugin. Read by
 * `build-plugin-zip.mts` when creating the archive and by
 * `resolve-performance-branches.mjs` when packaging a tested commit.
 *
 * Directories are listed bare and stand for everything below them.
 */
export const PLUGIN_FILES = [
	'gutenberg.php',
	'lib',
	'packages/block-serialization-default-parser/*.php',
	'packages/icons/src/manifest.php',
	'packages/icons/src/library/*.svg',
	'build',
	'build-module',
	'readme.txt',
	'changelog.txt',
	'README.md',
];
