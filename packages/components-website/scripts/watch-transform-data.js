const path = require( 'path' );
const chokidar = require( 'chokidar' );
const { generateDocData } = require( './generate-doc-data' );
const { getPostData } = require( './get-post-data' );

const src = path.resolve( __dirname, '../../components/src/**/*.md' );

const watcher = chokidar.watch( src );
let __state = { isReady: false };

function getState( key ) {
	if ( ! key ) {
		return __state;
	}
	return __state[ key ];
}
function setState( nextState = {} ) {
	__state = { ...__state, ...nextState };
}

function handleOnReady() {
	setState( { isReady: true } );
	// eslint-disable-next-line no-console
	console.log( '@wordpress/components docs data transformer ready.' );
}

async function handleOnChange( file ) {
	if ( ! getState( 'isReady' ) ) {
		return;
	}
	const basefile = path.basename( path.dirname( file ) );
	const [ data ] = await getPostData( file );

	try {
		await generateDocData( data );
		// eslint-disable-next-line no-console
		console.log( `Generated @wordpress/components/${ basefile } data` );
	} catch ( err ) {
		// eslint-disable-next-line no-console
		console.log( err );
	}
}

watcher.on( 'ready', handleOnReady );
watcher.on( 'add', handleOnChange );
watcher.on( 'change', handleOnChange );
