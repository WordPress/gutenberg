const rss = {};

rss.start = mem();

const express = require( 'express' );
const bodyParser = require( 'body-parser' );

process.on( 'SIGINT', () => process.exit() );

const app = express();
app.use( bodyParser.text( {
	limit: '512mb',
} ) );

let myParse;

app.post( '/', ( req, res ) => {
	const count = req.query.count || 1;

	rss.beforeParserInit = mem();
	if ( ! myParse ) {
		myParse = require( './parser.js' ).parse;
	}
	rss.afterParserInit = mem();

	const tic = process.hrtime();
	const parse = myParse( req.body );
	let sentinel = 1;
	for ( let i = 1; i < count; i++ ) {
		myParse( req.body );
		sentinel += i;
	}
	const [ s, ns ] = process.hrtime( tic );
	rss.end = mem();

	res.append( 'Access-Control-Allow-Origin', '*' );
	res.send( JSON.stringify( {
		parse,
		µs: ( s * 1e6 ) + ( ns / 1000 ),
		µsAvg: ( ( s * 1e6 ) + ( ns / 1000 ) ) / count,
		rss,
		sentinel,
	} ) );
} );

app.listen( 80 );

function mem() {
	return process.memoryUsage().rss;
}
