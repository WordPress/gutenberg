/**
 * Adds [Block] labels to a pull request for the blocks whose folders it changes.
 * A block's label matches its folder name or block.json title, else its parent block's.
 * Never removes labels, and adds none when the PR changes more than 3 blocks (a refactor).
 */
const fs = require( 'fs' );
const path = require( 'path' );

const SRC = 'packages/block-library/src';
const MAX = 3;

// Blocks whose label has another name.
const EXCEPTIONS = {
	'social-link': '[Block] Social',
	'social-links': '[Block] Social',
	'table-of-contents': '[Block] Table of contents (experimental)',
};

const norm = ( text ) =>
	text
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-+|-+$/g, '' );

function labelFor( dir, labels ) {
	if ( EXCEPTIONS[ dir ] ) {
		return EXCEPTIONS[ dir ];
	}
	const file = path.join( SRC, dir, 'block.json' );
	if ( ! fs.existsSync( file ) ) {
		return;
	}
	const block = JSON.parse( fs.readFileSync( file, 'utf8' ) );
	const label = labels.find( ( name ) =>
		[ dir, norm( block.title ) ].includes( norm( name.slice( 8 ) ) )
	);
	if ( label ) {
		return label;
	}
	const parent = ( block.parent || block.ancestor || [] )[ 0 ];
	if ( parent?.startsWith( 'core/' ) ) {
		return labelFor( parent.slice( 5 ), labels );
	}
}

module.exports = async ( { github, context, core } ) => {
	const { owner, repo } = context.repo;
	const pullNumber = context.payload.pull_request.number;
	const files = await github.paginate( github.rest.pulls.listFiles, {
		owner,
		repo,
		pull_number: pullNumber,
		per_page: 100,
	} );
	const dirs = new Set(
		files
			.map(
				( { filename } ) =>
					filename.match(
						/^packages\/block-library\/src\/([a-z0-9-]+)\//
					)?.[ 1 ]
			)
			.filter( Boolean )
	);
	if ( ! dirs.size ) {
		return;
	}
	const labels = (
		await github.paginate( github.rest.issues.listLabelsForRepo, {
			owner,
			repo,
			per_page: 100,
		} )
	)
		.map( ( { name } ) => name )
		.filter( ( name ) => name.startsWith( '[Block] ' ) );
	const found = [
		...new Set( [ ...dirs ].map( ( dir ) => labelFor( dir, labels ) ) ),
	].filter( Boolean );
	if ( ! found.length || found.length > MAX ) {
		core.info( `Block labels found: ${ found.length }. Adding none.` );
		return;
	}
	core.info( `Adding: ${ found.join( ', ' ) }` );
	await github.rest.issues.addLabels( {
		owner,
		repo,
		issue_number: pullNumber,
		labels: found,
	} );
};
