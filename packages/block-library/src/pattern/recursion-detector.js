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
 * @type {Map<string, Set<string>>}
 */
const patternDependencies = new Map();

/**
 * Parse a given pattern and traverse its contents to detect any subsequent
 * patterns on which it may depend. Such occurrences will be added to an
 * internal dependency graph. If a circular dependency is detected, an
 * error will be thrown.
 *
 * @param {Object} pattern        Pattern.
 * @param {string} pattern.name   Pattern name.
 * @param {Array}  pattern.blocks Pattern's block list.
 *
 * @throws {Error} If a circular dependency is detected.
 */
export function parsePatternDependencies( { name, blocks } ) {
	const queue = [ ...blocks ];
	while ( queue.length ) {
		const block = queue.shift();
		for ( const innerBlock of block.innerBlocks ?? [] ) {
			queue.unshift( innerBlock );
		}
		if ( block.name === 'core/pattern' ) {
			registerDependency( name, block.attributes.slug );
		}
	}
}

/**
 * Declare that pattern `a` depends on pattern `b`. If a circular
 * dependency is detected, an error will be thrown.
 *
 * Exported for testing purposes only.
 *
 * @param {string} a Slug for pattern A.
 * @param {string} b Slug for pattern B.
 *
 * @throws {Error} If a circular dependency is detected.
 */
export function registerDependency( a, b ) {
	if ( ! patternDependencies.has( a ) ) {
		patternDependencies.set( a, new Set() );
	}
	patternDependencies.get( a ).add( b );

	if ( hasCycle( a ) ) {
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
 * @param {string}      slug           Pattern slug.
 * @param {Set<string>} [visitedNodes] Set to track visited nodes in the graph.
 * @param {Set<string>} [currentPath]  Set to track and backtrack graph paths.
 * @return {boolean}                   Whether any cycle was found.
 */
function hasCycle( slug, visitedNodes = new Set(), currentPath = new Set() ) {
	visitedNodes.add( slug );
	currentPath.add( slug );

	const dependencies = patternDependencies.get( slug ) ?? new Set();

	for ( const dependency of dependencies ) {
		if ( ! visitedNodes.has( dependency ) ) {
			if ( hasCycle( dependency, visitedNodes, currentPath ) ) {
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

/**
 * Exported for testing purposes only.
 */
export function clearPatternDependencies() {
	patternDependencies.clear();
}
