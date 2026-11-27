/**
 * Writes an actions/labeler config with a [Block] label rule for each block folder.
 * A block's label matches its folder name or block.json title, else its parent block's.
 * Run it with sync-labels off, so block labels are only ever added, never removed.
 */
const fs = require( 'fs' );
const path = require( 'path' );

const SRC = 'packages/block-library/src';

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
	const labels = (
		await github.paginate( github.rest.issues.listLabelsForRepo, {
			...context.repo,
			per_page: 100,
		} )
	)
		.map( ( { name } ) => name )
		.filter( ( name ) => name.startsWith( '[Block] ' ) );
	const folders = {};
	for ( const dir of fs.readdirSync( SRC ).sort() ) {
		const label = labelFor( dir, labels );
		if ( label ) {
			( folders[ label ] ??= [] ).push( dir );
		}
	}
	// A PR changing more than 3 blocks at once (a refactor) gets none.
	let config = 'changed-files-labels-limit: 3\n';
	for ( const [ label, dirs ] of Object.entries( folders ) ) {
		config += `\n'${ label.replace( /'/g, "''" ) }':\n    - changed-files:\n          - any-glob-to-any-file:\n`;
		for ( const dir of dirs ) {
			config += `                - '${ SRC }/${ dir }/**'\n`;
		}
	}
	const file = path.join( process.env.RUNNER_TEMP, 'labeler-blocks.yml' );
	fs.writeFileSync( file, config );
	core.info( config );
	core.setOutput( 'path', file );
};
