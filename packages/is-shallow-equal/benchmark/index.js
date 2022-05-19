'use strict';

/**
 * External dependencies
 */
const Benchmark = require( 'benchmark' );

/**
 * WordPress dependencies
 */
const lazyImport = require( '@wordpress/lazy-import' );

const suite = new Benchmark.Suite();

const beforeObject = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 };
const afterObjectSame = beforeObject;
const afterObjectEqual = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 };
const afterObjectUnequal = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 'Unequal', g: 7 };
const beforeArray = [ 1, 2, 3, 4, 5, 6, 7 ];
const afterArraySame = beforeArray;
const afterArrayEqual = [ 1, 2, 3, 4, 5, 6, 7 ];
const afterArrayUnequal = [ 1, 2, 3, 4, 5, 'Unequal', 7 ];

Promise.all( [
	lazyImport( 'shallowequal@^1.1.0' ),
	lazyImport( 'shallow-equal@^1.2.1' ),
	lazyImport( 'is-equal-shallow@^0.1.3' ),
	lazyImport( 'shallow-equals@^1.0.0' ),
	lazyImport( 'fbjs@^1.0.0', {
		localPath: './lib/shallowEqual',
	} ),
] ).then(
	( [
		shallowequal,
		shallowEqual,
		isEqualShallow,
		shallowEquals,
		fbjsShallowEqual,
	] ) => {
		[
			[
				'@wordpress/is-shallow-equal (type specific)',
				require( '..' ).isShallowEqualObjects,
				require( '..' ).isShallowEqualArrays,
			],
			[ '@wordpress/is-shallow-equal', require( '..' ).default ],
			[ 'shallowequal', shallowequal ],
			[
				'shallow-equal (type specific)',
				shallowEqual.shallowEqualObjects,
				shallowEqual.shallowEqualArrays,
			],
			[ 'is-equal-shallow', isEqualShallow ],
			[ 'shallow-equals', shallowEquals ],
			[ 'fbjs/lib/shallowEqual', fbjsShallowEqual ],
		].forEach(
			( [
				name,
				isShallowEqualObjects,
				isShallowEqualArrays = isShallowEqualObjects,
			] ) => {
				suite.add( name + ' (object, equal)', () => {
					isShallowEqualObjects( beforeObject, afterObjectEqual );
				} );

				suite.add( name + ' (object, same)', () => {
					isShallowEqualObjects( beforeObject, afterObjectSame );
				} );

				suite.add( name + ' (object, unequal)', () => {
					isShallowEqualObjects( beforeObject, afterObjectUnequal );
				} );

				suite.add( name + ' (array, equal)', () => {
					isShallowEqualArrays( beforeArray, afterArrayEqual );
				} );

				suite.add( name + ' (array, same)', () => {
					isShallowEqualArrays( beforeArray, afterArraySame );
				} );

				suite.add( name + ' (array, unequal)', () => {
					isShallowEqualArrays( beforeArray, afterArrayUnequal );
				} );
			}
		);

		suite
			// eslint-disable-next-line no-console
			.on( 'cycle', ( event ) => console.log( event.target.toString() ) )
			.run( { async: true } );
	}
);
