const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'fast-glob' );
const mkdirp = require( 'mkdirp' );
const remark = require( 'remark' );
const visit = require( 'unist-util-visit' );

const localDocsDir = path.resolve( __dirname, '../../packages/components/src' );
const localDocs = path.join( localDocsDir, '/*/*.md' );
const localIndexDocs = path.join( localDocsDir, '/*.md' );
const dataDestDir = path.resolve( __dirname, '../public/_data' );

function getDataFileDir( filePath ) {
	const rootDest = path.resolve( __dirname, '../public/_data/components/' );
	const fileDir = path.dirname( filePath ).replace( localDocsDir, '' );

	return path.join( rootDest, fileDir );
}

async function getDataFromFile( filePath ) {
	const markdown = fs.readFileSync( filePath, 'utf-8' );
	const slug = path.basename( path.dirname( filePath ) );
	const rawFileName = path.basename( filePath ).toLowerCase();
	const fileName = rawFileName.replace( 'readme', 'index' );
	const dataFileName = fileName.replace( '.md', '.json' );
	const dataFileDest = getDataFileDir( filePath );
	const dataFilePath = path.join( dataFileDest, dataFileName );

	let url = path
		.join( dataFileDest.replace( dataDestDir, '' ), dataFileName )
		.replace( 'index.json', '' )
		.replace( '.json', '' );

	if ( ! url ) {
		url = '/';
	}

	const id = path
		.join( dataFileDest.replace( dataDestDir, '' ), dataFileName )
		.replace( /\.| |\//g, '-' )
		.replace( /^-|-json/g, '' );

	const postContent = remark()
		.use( () => {
			return transformer;

			function transformer( tree, file ) {
				const remove = [];

				visit( tree, [ 'heading' ], ( node ) => {
					const { type, depth, children } = node;
					if ( type === 'heading' && depth === 1 ) {
						file.data.title = children[ 0 ].value;
						remove.push( node );
					}
				} );

				visit( tree, [ 'code' ], ( node ) => {
					remove.push( node );
				} );

				visit( tree, ( node, index, parent ) => {
					if ( parent && remove.indexOf( node ) !== -1 ) {
						parent.children.splice( index, 1 );
						return [ visit.SKIP, index ];
					}
				} );
			}
		} )
		.processSync( markdown );

	return {
		title: postContent.data.title,
		slug,
		filePath,
		dataFilePath,
		dataFileDest,
		markdown,
		id,
		objectID: id,
		url,
	};
}

async function getPostData( singleFile ) {
	mkdirp.sync( dataDestDir );

	const files = singleFile ? [ singleFile ] : glob.sync( [ localDocs, localIndexDocs ] );

	try {
		const data = files.reduce( async ( asyncCollection, filePath ) => {
			const collection = await asyncCollection;
			const post = await getDataFromFile( filePath );

			return [ ...collection, post ];
		}, [] );

		return data;
	} catch ( err ) {
		return [];
	}
}

exports.getPostData = getPostData;
exports.dataDestDir = dataDestDir;
