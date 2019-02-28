/* eslint-disable @wordpress/package-side-effects */

const Benchmark = require( 'benchmark' );
const hooks = require( '../' );

const suite = new Benchmark.Suite;

const filter = process.argv[ 2 ];
const isInFilter = ( key ) => ! filter || filter === key;

function reset() {
	hooks.removeAllFilters( 'example' );
	hooks.removeAllActions( 'example' );
}

if ( isInFilter( 'applyFilters' ) ) {
	function myCallback() {}

	hooks.addFilter( 'example', 'myCallback', myCallback );

	suite
		.add( 'applyFilters - handled', () => {
			hooks.applyFilters( 'handled' );
		} )
		.add( 'applyFilters - unhandled', () => {
			hooks.applyFilters( 'unhandled' );
		} );
}

if ( isInFilter( 'addFilter' ) ) {
	let hasSetHighPriority = false;

	suite
		.add( 'addFilter - append last', () => {
			hooks.addFilter( 'example', 'myCallback', () => {} );
		} )
		.add( 'addFilter - default before higher priority', () => {
			if ( ! hasSetHighPriority ) {
				hasSetHighPriority = true;
				hooks.addFilter( 'example', 'priority', () => {}, 20 );
			}

			hooks.addFilter( 'example', 'myCallback', () => {} );
		} );
}

suite
	.on( 'cycle', reset )
	// eslint-disable-next-line no-console
	.on( 'cycle', ( event ) => console.log( event.target.toString() ) )
	.run( { async: true } );
