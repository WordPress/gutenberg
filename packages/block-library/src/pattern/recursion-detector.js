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
 * @param {string} a Slug for pattern A.
 * @param {string} b Slug for pattern B.
 *
 * @throws {Error} If a circular dependency is detected.
 */
function registerDependency( a, b ) {
	if ( ! patternDependencies.has( a ) ) {
		patternDependencies.set( a, new Set() );
	}
	patternDependencies.get( a ).add( b );

	if ( hasCircularDependency( a ) ) {
		throw new TypeError(
			`Pattern ${ a } has a circular dependency and cannot be rendered.`
		);
	}
}

function hasCircularDependency(
	slug,
	visitedNodes = new Set(),
	currentPath = new Set()
) {
	visitedNodes.add( slug );
	currentPath.add( slug );

	const dependencies = patternDependencies.get( slug ) ?? new Set();

	for ( const dependency of dependencies ) {
		if ( ! visitedNodes.has( dependency ) ) {
			if (
				hasCircularDependency( dependency, visitedNodes, currentPath )
			) {
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
