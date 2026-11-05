import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = fileURLToPath(
	new URL( '../../../', import.meta.url )
);

/**
 * Finds the paths that `.gitattributes` marks as `linguist-generated`, the
 * attribute that makes GitHub collapse a file's diff. Git matches the
 * patterns, so the paths need not exist in the checkout.
 *
 * @param paths Repository-relative paths.
 * @return The generated paths.
 */
export function findGeneratedFiles( paths: string[] ): Set< string > {
	if ( ! paths.length ) {
		return new Set();
	}

	// With `-z`, each result is three fields: path, attribute and value.
	const fields = execFileSync(
		'git',
		[ 'check-attr', '--stdin', '-z', 'linguist-generated' ],
		{ cwd: REPOSITORY_ROOT, input: paths.join( '\0' ), encoding: 'utf8' }
	).split( '\0' );

	const generated = new Set< string >();
	for ( let index = 0; index + 2 < fields.length; index += 3 ) {
		// `set` is the attribute without a value, `true` is `=true`.
		if ( [ 'set', 'true' ].includes( fields[ index + 2 ] ) ) {
			generated.add( fields[ index ] );
		}
	}

	return generated;
}
