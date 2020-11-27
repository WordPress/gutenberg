/**
 * WordPress dependencies
 */
const {
	createAtom,
	createAtomSelector,
	createAtomRegistry,
} = require( '@wordpress/stan' );

const items = {};
const itemsMap = new Map();

const digit = ( n ) => ( e ) => Math.floor( ( n % ( e * 10 ) ) / e );
for ( let i = 0; i < 100000; i++ ) {
	const title = [ 10000, 1000, 100, 10, 1 ].map( digit( i ) ).join( '' );
	items[ i ] = { title };
	const mapEntry = new Map();
	mapEntry.set( 'title', title );
	itemsMap.set( i, mapEntry );
}

const getItemProp = ( id, prop ) => items[ id ][ prop ];
const getMapItemProp = ( id, prop ) => itemsMap.get( id ).get( prop );

const itemsA = createAtom( items );

const itemS = createAtomSelector( ( id ) => ( { get } ) =>
	get( itemsA )[ id ]
);
const itemPropS = createAtomSelector( ( id, prop ) => ( { get } ) =>
	get( itemS( id ) )[ prop ]
);

const timed = ( fun, label ) => {
	console.time( label );
	fun();
	console.timeEnd( label );
};

function runStanChmark() {
	const registry = createAtomRegistry();

	function benchRedux() {
		for ( let i = 0; i < 100000; i++ ) {
			getItemProp( i, 'title' );
		}
	}

	function benchReduxMap() {
		for ( let i = 0; i < 100000; i++ ) {
			getMapItemProp( i, 'title' );
		}
	}

	function benchStan() {
		for ( let i = 0; i < 100000; i++ ) {
			registry.get( itemPropS( i, 'title' ) );
		}
	}

	for ( let i = 0; i < 10; i++ ) {
		timed( benchRedux, 'redux-' + i );
	}

	console.log();

	for ( let i = 0; i < 10; i++ ) {
		timed( benchReduxMap, 'redux-map-' + i );
	}

	console.log();

	for ( let i = 0; i < 10; i++ ) {
		timed( benchStan, 'stan-' + i );
	}
}

runStanChmark();
