const fs = require( 'fs' );
const path = require( 'path' );
const mkdirp = require( 'mkdirp' );
const { getPostData } = require( './get-post-data' );
const { orderBy } = require( 'lodash' );

const destDir = path.resolve( __dirname, '../src/data' );
const fileDest = path.join( destDir, 'navigation.json' );

async function generateNav() {
	// eslint-disable-next-line no-console
	console.log( 'Creating navigation file from markdown content...\n' );

	mkdirp.sync( destDir );

	// eslint-disable-next-line no-console
	console.log( 'Generating data from markdown files...' );

	const posts = await getPostData();
	const data = posts.map( ( post ) => {
		const { title, url, id } = post;
		return {
			title,
			url,
			id,
		};
	} );

	const sortedData = orderBy( data, [ 'title' ], [ 'asc' ] );

	// eslint-disable-next-line no-console
	console.log( '\nCreating data navigation.json files...' );

	const content = JSON.stringify( sortedData, null, 2 );

	fs.writeFileSync( fileDest, content );

	// eslint-disable-next-line no-console
	console.log( '\n\nSuccessfully generated navigation file!' );
}

( async () => {
	generateNav();
} )();
