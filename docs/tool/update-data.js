/**
 * Node dependencies.
 */
const { join } = require( 'path' );
const spawnSync = require( 'child_process' ).spawnSync;

/**
 * Local dependencies.
 */
const getPackages = require( './packages' );

getPackages().forEach( ( entry ) => {
	const [ packageName, targetFiles ] = entry;

	Object.entries( targetFiles ).forEach( ( [ token, target ] ) => {
		// Note that this needs to be a sync process for each output file that is updated:
		// until docgen provides a way to update many tokens at once, we need to make sure
		// the output file is updated before starting the second pass for the next token.
		const { status, stderr } = spawnSync(
			join(
				__dirname,
				'..',
				'..',
				'node_modules',
				'.bin',
				'docgen'
			).replace( / /g, '\\ ' ),
			[
				target,
				`--output docs/designers-developers/developers/data/data-${ packageName.replace(
					'/',
					'-'
				) }.md`,
				'--to-token',
				`--use-token "${ token }"`,
				'--ignore "/unstable|experimental/i"',
			],
			{ shell: true }
		);

		if ( status !== 0 ) {
			process.stderr.write( `${ packageName } ${ stderr.toString() }\n` );
			process.exit( 1 );
		}
	} );
} );
