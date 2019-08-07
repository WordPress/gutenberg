const { getPostData } = require( './get-post-data' );
const { generateDocData } = require( './generate-doc-data' );

async function generateDocs() {
	// eslint-disable-next-line no-console
	console.log( 'Creating data.json file from markdown content...\n' );
	// eslint-disable-next-line no-console
	console.log( 'Generating data from markdown files...' );

	const files = await getPostData();

	// eslint-disable-next-line no-console
	console.log( '\nCreating data .json files...' );

	const tasks = [];

	files.forEach( ( post ) => {
		const task = generateDocData( post );
		tasks.push( task );
	} );

	await Promise.all( tasks );

	// eslint-disable-next-line no-console
	console.log( '\n\nuccessfully generated data files!' );
}

( async () => {
	generateDocs();
} )();
