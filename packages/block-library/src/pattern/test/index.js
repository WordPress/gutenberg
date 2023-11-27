/**
 * Internal dependencies
 */
import {
	parsePatternDependencies,
	registerDependency,
	clearPatternDependencies,
} from '../recursion-detector';

describe( 'core/pattern', () => {
	beforeEach( () => {
		clearPatternDependencies();
	} );

	describe( 'parsePatternDependencies', () => {
		it( "is silent for patterns that don't require other patterns", () => {
			const pattern = {
				name: 'test/benign-pattern',
				blocks: [ { name: 'core/paragraph' } ],
			};
			expect( () => {
				parsePatternDependencies( pattern );
			} ).not.toThrow();
		} );
		it( 'catches self-referencing patterns', () => {
			const pattern = {
				name: 'test/evil-pattern',
				blocks: [ { name: 'core/pattern', slug: 'test/evil-pattern' } ],
			};
			expect( () => {
				parsePatternDependencies( pattern );
			} ).toThrow();
		} );
	} );

	describe( 'registerDependency', () => {
		it( 'is silent for patterns with no circular dependencies', () => {
			expect( () => {
				registerDependency( 'a', 'b' );
			} ).not.toThrow();
		} );
		it( 'catches self-referencing patterns', () => {
			expect( () => {
				registerDependency( 'a', 'a' );
			} ).toThrow();
		} );
		it( 'catches mutually-referencing patterns', () => {
			registerDependency( 'a', 'b' );
			expect( () => {
				registerDependency( 'b', 'a' );
			} ).toThrow();
		} );
		it( 'catches longer cycles', () => {
			registerDependency( 'a', 'b' );
			registerDependency( 'b', 'c' );
			registerDependency( 'b', 'd' );
			expect( () => {
				registerDependency( 'd', 'a' );
			} ).toThrow();
		} );
		it( 'catches any pattern depending on a tainted one', () => {
			registerDependency( 'a', 'b' );
			registerDependency( 'b', 'c' );
			registerDependency( 'b', 'd' );
			expect( () => {
				registerDependency( 'd', 'a' );
			} ).toThrow();
			expect( () => {
				registerDependency( 'e', 'd' );
			} ).toThrow();
		} );
	} );
} );
