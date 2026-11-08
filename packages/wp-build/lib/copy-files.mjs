import { readFile, writeFile, copyFile, mkdir } from 'fs/promises';
import path from 'path';
import glob from 'fast-glob';

/**
 * @typedef {Object} PhpTransforms
 *
 * @property {string}   [functionPrefix]    Prefix for the functions a PHP file defines, replacing a `wp_` prefix.
 * @property {string}   [classSuffix]       Suffix for the classes in `suffixClasses`.
 * @property {string[]} [prefixFunctions]   Other functions to prefix with `functionPrefix`.
 * @property {string[]} [suffixClasses]     Classes to suffix with `classSuffix`.
 * @property {number}   [addActionPriority] Priority to add to the `init` action registering a block.
 * @property {string}   [filenameSuffix]    Suffix for the copied file's name.
 * @property {boolean}  [flattenIndexFiles] Whether to copy `{name}/index.php` to `{name}.php`.
 */

/**
 * @typedef {Object} CopyFiles
 *
 * @property {string[]}                files        Glob patterns of the files to copy, relative to the package.
 * @property {{ php?: PhpTransforms }} [transforms] Transforms to apply to the copied files.
 */

/**
 * @typedef {{ wpCopyFiles?: CopyFiles }} CopyFilesPackageJson
 */

/**
 * Interprets a configuration value as a boolean, where `"true"` and `"1"`
 * are considered true while all other values are false.
 *
 * @param {string|undefined} value The configuration value to interpret.
 * @return {boolean|undefined} Boolean interpretation of the given configuration value, or undefined if not set.
 */
export const boolConfigVal = ( value ) => {
	if ( value === undefined ) {
		return undefined;
	}
	return [ 'true', '1' ].includes( value.toLowerCase() );
};

/**
 * Apply a package's `wpCopyFiles` PHP transforms to a PHP file's content.
 *
 * @param {string}        content    PHP file content.
 * @param {PhpTransforms} transforms The `wpCopyFiles.transforms.php` configuration.
 * @return {string} Transformed content.
 */
export function transformPhpContent( content, transforms ) {
	const {
		functionPrefix = '',
		classSuffix = '',
		prefixFunctions = [],
		suffixClasses = [],
		addActionPriority,
	} = transforms;

	content = content.toString();

	/*
	 * Transforms are used to modify PHP files that are committed to version
	 * control in their wordpress-develop state (`wp_` function prefixes, `WP_`
	 * class prefixes, etc.). When building for WordPress Core, it's not
	 * necessary to perform these steps.
	 */
	if (
		boolConfigVal( process.env.IS_WORDPRESS_CORE ) ??
		boolConfigVal( process.env.npm_package_config_IS_WORDPRESS_CORE )
	) {
		return content;
	}

	if ( prefixFunctions.length ) {
		content = content.replace(
			new RegExp( prefixFunctions.join( '|' ), 'g' ),
			( match ) => `${ functionPrefix }${ match.replace( /^wp_/, '' ) }`
		);
	}

	if ( suffixClasses.length ) {
		content = content.replace(
			new RegExp( suffixClasses.join( '|' ), 'g' ),
			( match ) => `${ match }${ classSuffix }`
		);
	}

	if ( functionPrefix ) {
		content = Array.from(
			content.matchAll( /^\s*function ([^\(]+)/gm )
		).reduce( ( result, [ , functionName ] ) => {
			return result.replace(
				new RegExp( functionName + '(?![a-zA-Z0-9_])', 'g' ),
				( match ) => functionPrefix + match.replace( /^wp_/, '' )
			);
		}, content );
	}

	if ( addActionPriority ) {
		content = content.replace(
			/(add_action\(\s*'init',\s*'gutenberg_register_block_[^']+'(?!,))/,
			`$1, ${ addActionPriority }`
		);
	}

	return content;
}

/**
 * Find the source files a package copies to the build with `wpCopyFiles`.
 *
 * @param {string}               packageDir  Package directory.
 * @param {CopyFilesPackageJson} packageJson Package's package.json.
 * @return {Promise<string[]>} Absolute paths of the files to copy.
 */
export async function getCopyFiles( packageDir, packageJson ) {
	if ( ! packageJson.wpCopyFiles ) {
		return [];
	}
	// Glob relative to the package, so that its path is not read as a pattern.
	return glob( packageJson.wpCopyFiles.files, {
		cwd: packageDir,
		absolute: true,
	} );
}

/**
 * Copy one of a package's `wpCopyFiles` to the build, transforming PHP files.
 *
 * @param {string}               sourceFile  Absolute path of the file to copy.
 * @param {string}               packageDir  Package directory.
 * @param {string}               outputDir   Directory the package's files are copied to.
 * @param {CopyFilesPackageJson} packageJson Package's package.json.
 */
export async function copyPackageFile(
	sourceFile,
	packageDir,
	outputDir,
	packageJson
) {
	const transforms = packageJson.wpCopyFiles?.transforms ?? {};
	const relativePath = path.relative(
		path.join( packageDir, 'src' ),
		sourceFile
	);
	let destPath = path.join( outputDir, relativePath );

	if ( ! sourceFile.endsWith( '.php' ) || ! transforms.php ) {
		await mkdir( path.dirname( destPath ), { recursive: true } );
		await copyFile( sourceFile, destPath );
		return;
	}

	const content = await readFile( sourceFile, 'utf8' );
	const transformed = transformPhpContent( content, transforms.php );

	if ( transforms.php.filenameSuffix ) {
		const ext = path.extname( destPath );
		const base = path.basename( destPath, ext );
		destPath = path.join(
			path.dirname( destPath ),
			`${ base }${ transforms.php.filenameSuffix }${ ext }`
		);
	}

	// Check if we should flatten index.php files
	if (
		transforms.php.flattenIndexFiles &&
		path.basename( sourceFile ) === 'index.php'
	) {
		// Flatten: button/index.php → button.php
		const parentDir = path.dirname( destPath );
		const blockName = path.basename( parentDir );
		destPath = path.join( path.dirname( parentDir ), `${ blockName }.php` );
	}

	await mkdir( path.dirname( destPath ), { recursive: true } );
	await writeFile( destPath, transformed );
}
