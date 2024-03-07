/**
 * Internal dependencies
 */
import {
	parsePatternDependencies,
	registerDependency,
} from '../recursion-detector';

describe( 'core/pattern', () => {
	const deps = new Map();

	beforeEach( () => {
		deps.clear();
	} );

	describe( 'parsePatternDependencies', () => {
		it( "is silent for patterns that don't require other patterns", () => {
			const pattern = {
				name: 'test/benign-pattern',
				blocks: [ { name: 'core/paragraph' } ],
			};
			expect( () => {
				parsePatternDependencies( deps, pattern );
			} ).not.toThrow();
		} );
		it( 'catches self-referencing patterns', () => {
			const pattern = {
				name: 'test/evil-pattern',
				blocks: [ { name: 'core/pattern', slug: 'test/evil-pattern' } ],
			};
			expect( () => {
				parsePatternDependencies( deps, pattern );
			} ).toThrow();
		} );
	} );

	describe( 'registerDependency', () => {
		it( 'is silent for patterns with no circular dependencies', () => {
			expect( () => {
				registerDependency( deps, 'a', 'b' );
			} ).not.toThrow();
		} );
		it( 'catches self-referencing patterns', () => {
			expect( () => {
				registerDependency( deps, 'a', 'a' );
			} ).toThrow();
		} );
		it( 'catches mutually-referencing patterns', () => {
			registerDependency( deps, 'a', 'b' );
			expect( () => {
				registerDependency( deps, 'b', 'a' );
			} ).toThrow();
		} );
		it( 'catches longer cycles', () => {
			registerDependency( deps, 'a', 'b' );
			registerDependency( deps, 'b', 'c' );
			registerDependency( deps, 'b', 'd' );
			expect( () => {
				registerDependency( deps, 'd', 'a' );
			} ).toThrow();
		} );
		it( 'catches any pattern depending on a tainted one', () => {
			registerDependency( deps, 'a', 'b' );
			registerDependency( deps, 'b', 'c' );
			registerDependency( deps, 'b', 'd' );
			expect( () => {
				registerDependency( deps, 'd', 'a' );
			} ).toThrow();
			expect( () => {
				registerDependency( deps, 'e', 'd' );
			} ).toThrow();
		} );
	} );
} );
