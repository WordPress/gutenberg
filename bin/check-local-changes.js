/**
 * External dependencies
 */
const SimpleGit = require( 'simple-git' );

SimpleGit()
	.diff( [ '-U0' ] )
	.then( ( diff ) => {
		// npm will introduce changes to a `package-lock.json` file for optional
		// dependencies varying on environment. If the only changes are the
		// addition of an "optional" flag in `package-lock.json` file from
		// `git diff`: we ignore the results.
		//
		// See: https://github.com/npm/npm/issues/17722

		// Example input:
		//
		// diff --git a/package-lock.json b/package-lock.json
		// index e8c8a25dc..251af8689 100644
		// --- a/package-lock.json
		// +++ b/package-lock.json
		// @@ -14373 +14373,2 @@
		// -                       "dev": true
		// +                       "dev": true,
		// +                       "optional": true
		// @@ -14648 +14649,2 @@
		// -                       "dev": true
		// +                       "dev": true,
		// +                       "optional": true
		const nonOptionalDiff = diff
			// Strip individual diffs of optional-only.
			.replace(
				/@@ .+ @@\n(-.+\n\+.+,\n)?\+.+\"optional\": true,?\n/gm,
				''
			)
			// If no more line diffs remain after above, remove diff heading for file.
			.replace(
				/diff --git a\/package-lock.json b\/package-lock.json\nindex \w+..\w+ \d+\n--- a\/package-lock.json\n\+\+\+ b\/package-lock.json\n(?!@@)/,
				''
			);

		if ( !! nonOptionalDiff ) {
			console.error(
				`There are local changes after running one or more of the following commands:

- npm install
- npm run docs:build
- npm run --workspace @wordpress/theme build

Run these commands in your local environment and commit the resulting changes to resolve the issue.
`
			);
			console.log( nonOptionalDiff );
			process.exitCode = 1;
		}
	} )
	.catch( ( error ) => {
		console.error(
			'Checking local changes failed!\n\n' + error.toString() + '\n'
		);
		process.exitCode = 1;
	} );
