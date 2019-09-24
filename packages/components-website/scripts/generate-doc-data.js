const fs = require( 'fs' );
const mkdirp = require( 'mkdirp' );

async function generateDocData( post ) {
	return new Promise( ( resolve, reject ) => {
		try {
			const { dataFileDest, dataFilePath, title, content, slug, markdown } = post;
			mkdirp.sync( dataFileDest );

			const props = { title, content, slug, markdown };
			const writeContent = JSON.stringify( props, null, 2 );

			fs.writeFileSync( dataFilePath, writeContent );

			resolve();
		} catch ( err ) {
			reject( err );
		}
	} );
}

exports.generateDocData = generateDocData;
