const Benchmark = require( 'benchmark' );
const { __ } = require( '../' );

const suite = new Benchmark.Suite;

suite
	.add( '__', () => {
		__( 'Translate' );
	} )
	.on( 'cycle', ( event ) => console.log( event.target.toString() ) )
	.run( { async: true } );
