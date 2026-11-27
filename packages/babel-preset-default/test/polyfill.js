import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, test } from 'vitest';

const buildDirectory = path.join(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'../build'
);

describe( 'polyfill build', () => {
	test.each( [ 'polyfill.js', 'polyfill.min.js' ] )(
		'%s runs as a concatenated classic script',
		( file ) => {
			const script = readFileSync(
				path.join( buildDirectory, file ),
				'utf8'
			);
			const context = vm.createContext( {
				DOMException,
				URL,
				URLSearchParams,
			} );
			vm.runInContext( 'delete Array.prototype.toSorted;', context );

			// The previous script does not end with a semicolon.
			vm.runInContext( `var previous = 1\n${ script }`, context );

			expect(
				vm.runInContext( '[ 3, 1, 2 ].toSorted().join()', context )
			).toBe( '1,2,3' );
			// Only strict mode keeps `this` null, so that the polyfill throws.
			expect(
				vm.runInContext(
					`try {
						Array.prototype.toSorted.call( null );
					} catch ( error ) {
						error.name;
					}`,
					context
				)
			).toBe( 'TypeError' );
		}
	);
} );
