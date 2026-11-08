/**
 * Reads the single package result from `npm pack --json` output.
 *
 * @param {string} stdout      The `npm pack --json` stdout.
 * @param {string} packageName Package name for error messages.
 *
 * @return {Object} The pack result for the package.
 */
export function readNpmPackResult( stdout, packageName ) {
	let output;
	try {
		output = JSON.parse( stdout );
	} catch {
		throw new Error(
			`Could not parse npm pack output for ${ packageName }:\n${ stdout }`
		);
	}
	/* npm v12 keys `pack --json` output by package name; older versions return an array. */
	const results = Array.isArray( output )
		? output
		: Object.values( output ?? {} );
	if ( results.length !== 1 ) {
		throw new Error(
			`Expected one npm pack result for ${ packageName }, got ${ results.length }.`
		);
	}
	const [ result ] = results;
	if (
		typeof result?.filename !== 'string' ||
		! Array.isArray( result.files )
	) {
		throw new Error(
			`Unexpected npm pack result for ${ packageName }: ${ JSON.stringify(
				result
			) }`
		);
	}
	return result;
}
