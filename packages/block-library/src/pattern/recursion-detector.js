/**
 * THIS MODULE IS INTENTIONALLY KEPT WITHIN THE PATTERN BLOCK'S SOURCE.
 *
 * This is because this approach for preventing infinite loops due to
 * recursively rendering blocks is specific to the way that the `core/pattern`
 * block behaves in the editor. Any other block types that deal with recursion
 * SHOULD USE THE STANDARD METHOD for avoiding loops:
 *
 * @see https://github.com/WordPress/gutenberg/pull/31455
 * @see packages/block-editor/src/components/recursion-provider/README.md
 */

/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';

/**
 * Naming is hard.
 *
 * @see useParsePatternDependencies
 *
 * @type {WeakMap<Object, Function>}
 */
const cachedParsers = new WeakMap();

/**
 * Hook used by PatternEdit to parse block patterns. It returns a function that
 * takes a pattern and returns nothing but throws an error if the pattern is
 * recursive.
 *
 * @example
 * ```js
 * const parsePatternDependencies = useParsePatternDependencies();
 * parsePatternDependencies( selectedPattern );
 * ```
 *
 * @see parsePatternDependencies
 *
 * @return {Function} A function to parse block patterns.
 */
export function useParsePatternDependencies() {
	const registry = useRegistry();

	// Instead of caching maps, go straight to the point and cache bound
	// functions. Each of those functions is bound to a different Map that will
	// keep track of patterns in the context of the given registry.
	if ( ! cachedParsers.has( registry ) ) {
		const deps = new Map();
		cachedParsers.set(
			registry,
			parsePatternDependencies.bind( null, deps )
		);
	}
	return cachedParsers.get( registry );
}

/**
 * Parse a given pattern and traverse its contents to detect any subsequent
 * patterns on which it may depend. Such occurrences will be added to an
 * internal dependency graph. If a circular dependency is detected, an
 * error will be thrown.
 *
 * EXPORTED FOR TESTING PURPOSES ONLY.
 *
 * @param {Map<string, Set<string>>} deps           Map of pattern dependencies.
 * @param {Object}                   pattern        Pattern.
 * @param {string}                   pattern.name   Pattern name.
 * @param {Array}                    pattern.blocks Pattern's block list.
 *
 * @throws {Error} If a circular dependency is detected.
 */
export function parsePatternDependencies( deps, { name, blocks } ) {
	const queue = [ ...blocks ];
	while ( queue.length ) {
		const block = queue.shift();
		for ( const innerBlock of block.innerBlocks ?? [] ) {
			queue.unshift( innerBlock );
		}
		if ( block.name === 'core/pattern' ) {
			registerDependency( deps, name, block.attributes.slug );
		}
	}
}

/**
 * Declare that pattern `a` depends on pattern `b`. If a circular
 * dependency is detected, an error will be thrown.
 *
 * EXPORTED FOR TESTING PURPOSES ONLY.
 *
 * @param {Map<string, Set<string>>} deps Map of pattern dependencies.
 * @param {string}                   a    Slug for pattern A.
 * @param {string}                   b    Slug for pattern B.
 *
 * @throws {Error} If a circular dependency is detected.
 */
export function registerDependency( deps, a, b ) {
	if ( ! deps.has( a ) ) {
		deps.set( a, new Set() );
	}
	deps.get( a ).add( b );
	if ( hasCycle( deps, a ) ) {
		throw new TypeError(
			`Pattern ${ a } has a circular dependency and cannot be rendered.`
		);
	}
}

/**
 * Determine if a given pattern has circular dependencies on other patterns.
 * This will be determined by running a depth-first search on the current state
 * of the graph represented by `patternDependencies`.
 *
 * @param {Map<string, Set<string>>} deps           Map of pattern dependencies.
 * @param {string}                   slug           Pattern slug.
 * @param {Set<string>}              [visitedNodes] Set to track visited nodes in the graph.
 * @param {Set<string>}              [currentPath]  Set to track and backtrack graph paths.
 * @return {boolean} Whether any cycle was found.
 */
function hasCycle(
	deps,
	slug,
	visitedNodes = new Set(),
	currentPath = new Set()
) {
	visitedNodes.add( slug );
	currentPath.add( slug );

	const dependencies = deps.get( slug ) ?? new Set();

	for ( const dependency of dependencies ) {
		if ( ! visitedNodes.has( dependency ) ) {
			if ( hasCycle( deps, dependency, visitedNodes, currentPath ) ) {
				return true;
			}
		} else if ( currentPath.has( dependency ) ) {
			return true;
		}
	}

	// Remove the current node from the current path when backtracking
	currentPath.delete( slug );
	return false;
}
