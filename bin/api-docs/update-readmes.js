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

	Object.entries( targetFiles ).forEach( ( [ token, path ] ) => {
		// Each target operates over the same file, so it needs to be processed synchronously,
		// as to make sure the processes don't overwrite each other.
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
				join( 'packages', packageName, path ),
				`--output packages/${ packageName }/README.md`,
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
