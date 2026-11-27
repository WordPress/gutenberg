import { mkdtemp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	copyPackageFile,
	getCopyFiles,
	transformPhpContent,
} from '../copy-files.mjs';

const BLOCK_PHP = `<?php
function render_block_core_example( $attributes ) {
	return wp_apply_colors_support( $attributes );
}

function register_block_core_example() {
	register_block_type_from_metadata( __DIR__ . '/example' );
}
add_action( 'init', 'register_block_core_example' );
`;

const CLASS_PHP = `<?php
class WP_Example_Store {
	public static function get_store() {
		return new WP_Example_Store();
	}
}
`;

describe( 'copy-files', () => {
	let rootDir;
	let packageDir;
	let outputDir;

	/**
	 * Write a file into the fixture package's `src` directory.
	 *
	 * @param {string} relativePath Path relative to `src`.
	 * @param {string} content      File content.
	 * @return {Promise<string>} Absolute path of the file.
	 */
	async function writeSourceFile( relativePath, content ) {
		const file = path.join( packageDir, 'src', relativePath );
		await mkdir( path.dirname( file ), { recursive: true } );
		await writeFile( file, content );
		return file;
	}

	beforeEach( async () => {
		// Parentheses check that the path is not read as a glob pattern.
		rootDir = await mkdtemp(
			path.join( tmpdir(), 'wp-build-copy-(dev)-' )
		);
		packageDir = path.join( rootDir, 'example' );
		outputDir = path.join( rootDir, 'build', 'scripts', 'example' );
		vi.stubEnv( 'IS_WORDPRESS_CORE', '' );
		vi.stubEnv( 'npm_package_config_IS_WORDPRESS_CORE', '' );
	} );

	afterEach( async () => {
		vi.unstubAllEnvs();
		await rm( rootDir, { recursive: true, force: true } );
	} );

	describe( 'copyPackageFile', () => {
		it( 'flattens an index.php into a file named after its directory and prefixes its functions', async () => {
			const sourceFile = await writeSourceFile(
				'example/index.php',
				BLOCK_PHP
			);
			const packageJson = {
				wpCopyFiles: {
					transforms: {
						php: {
							functionPrefix: 'gutenberg_',
							prefixFunctions: [ 'wp_apply_colors_support' ],
							flattenIndexFiles: true,
							addActionPriority: 20,
						},
					},
				},
			};

			await copyPackageFile(
				sourceFile,
				packageDir,
				outputDir,
				packageJson
			);

			const output = await readFile(
				path.join( outputDir, 'example.php' ),
				'utf8'
			);
			expect( output ).toContain(
				'function gutenberg_render_block_core_example( $attributes )'
			);
			expect( output ).toContain(
				'return gutenberg_apply_colors_support( $attributes );'
			);
			expect( output ).toContain(
				"add_action( 'init', 'gutenberg_register_block_core_example', 20 );"
			);
		} );

		it( 'keeps the directory of a PHP file not named index.php when flattening', async () => {
			const sourceFile = await writeSourceFile(
				'example/helpers.php',
				'<?php\n'
			);
			const packageJson = {
				wpCopyFiles: {
					transforms: { php: { flattenIndexFiles: true } },
				},
			};

			await copyPackageFile(
				sourceFile,
				packageDir,
				outputDir,
				packageJson
			);

			expect(
				await readFile(
					path.join( outputDir, 'example', 'helpers.php' ),
					'utf8'
				)
			).toBe( '<?php\n' );
		} );

		it( 'adds the filename suffix and suffixes the classes', async () => {
			const sourceFile = await writeSourceFile(
				'class-wp-example-store.php',
				CLASS_PHP
			);
			const packageJson = {
				wpCopyFiles: {
					transforms: {
						php: {
							classSuffix: '_Gutenberg',
							suffixClasses: [ 'WP_Example_Store' ],
							filenameSuffix: '-gutenberg',
						},
					},
				},
			};

			await copyPackageFile(
				sourceFile,
				packageDir,
				outputDir,
				packageJson
			);

			const output = await readFile(
				path.join( outputDir, 'class-wp-example-store-gutenberg.php' ),
				'utf8'
			);
			expect( output ).toContain( 'class WP_Example_Store_Gutenberg {' );
			expect( output ).toContain(
				'return new WP_Example_Store_Gutenberg();'
			);
		} );

		it( 'copies a file that is not PHP unchanged, at its own path', async () => {
			const blockJson = '{ "name": "core/example" }\n';
			const sourceFile = await writeSourceFile(
				'example/block.json',
				blockJson
			);
			const packageJson = {
				wpCopyFiles: {
					transforms: {
						php: {
							functionPrefix: 'gutenberg_',
							flattenIndexFiles: true,
						},
					},
				},
			};

			await copyPackageFile(
				sourceFile,
				packageDir,
				outputDir,
				packageJson
			);

			expect(
				await readFile(
					path.join( outputDir, 'example', 'block.json' ),
					'utf8'
				)
			).toBe( blockJson );
		} );

		it( 'copies a PHP file unchanged, at its own path, when there are no PHP transforms', async () => {
			const sourceFile = await writeSourceFile(
				'example/index.php',
				BLOCK_PHP
			);

			await copyPackageFile( sourceFile, packageDir, outputDir, {
				wpCopyFiles: {},
			} );

			expect(
				await readFile(
					path.join( outputDir, 'example', 'index.php' ),
					'utf8'
				)
			).toBe( BLOCK_PHP );
		} );
	} );

	describe( 'transformPhpContent', () => {
		it( 'leaves the content unchanged when building for WordPress Core', () => {
			vi.stubEnv( 'IS_WORDPRESS_CORE', 'true' );

			expect(
				transformPhpContent( BLOCK_PHP, {
					functionPrefix: 'gutenberg_',
					addActionPriority: 20,
				} )
			).toBe( BLOCK_PHP );
		} );
	} );

	describe( 'getCopyFiles', () => {
		it( 'finds the files matching the patterns, relative to the package', async () => {
			const indexFile = await writeSourceFile(
				'example/index.php',
				BLOCK_PHP
			);
			const blockJsonFile = await writeSourceFile(
				'example/block.json',
				'{}\n'
			);
			await writeSourceFile( 'example/edit.js', '' );

			const files = await getCopyFiles( packageDir, {
				wpCopyFiles: {
					files: [ 'src/**/*.php', 'src/*/block.json' ],
				},
			} );

			expect( files.sort() ).toEqual(
				[ blockJsonFile, indexFile ]
					.map( ( file ) => file.replace( /\\/g, '/' ) )
					.sort()
			);
		} );

		it( 'finds no files for a package without wpCopyFiles', async () => {
			expect( await getCopyFiles( packageDir, {} ) ).toEqual( [] );
		} );
	} );
} );
