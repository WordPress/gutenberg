const SOURCE_EXTENSIONS = [ 'js', 'jsx', 'mjs', 'ts', 'tsx' ];
const TEST_FILE_PATTERNS = [
	/\/(benchmark|__mocks__|__tests__|test|storybook|stories)\/.+/,
	new RegExp( `\\.(spec|test)\\.(${ SOURCE_EXTENSIONS.join( '|' ) })$` ),
];

/**
 * Add every supported source extension to a file glob.
 *
 * @param {string} basePattern File glob without an extension.
 * @return {string} File glob with all supported source extensions.
 */
export function getSourceFileGlob( basePattern ) {
	return `${ basePattern }.{${ SOURCE_EXTENSIONS.join( ',' ) }}`;
}

/**
 * Determine whether a source path belongs to tests or development fixtures.
 *
 * @param {string} relativePath Repository-relative source path.
 * @return {boolean} True when the path should be excluded from production source.
 */
export function isTestSourceFile( relativePath ) {
	return TEST_FILE_PATTERNS.some( ( regex ) => regex.test( relativePath ) );
}
