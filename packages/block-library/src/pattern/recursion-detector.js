/**
 * @type {Map<string, Set<string>>}
 */
const deps = new Map();

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
			dependsOn( name, block.attributes.slug );
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
function dependsOn( a, b ) {
	if ( ! deps.has( a ) ) {
		deps.set( a, new Set() );
	}
	deps.get( a ).add( b );

	if ( hasCircularDependency( a ) ) {
		throw new Error(
			`Pattern ${ a } has a circular dependency and cannot be rendered.`
		);
	}
}

function hasCircularDependency(
	id,
	visitedNodes = new Set(),
	currentPath = new Set()
) {
	visitedNodes.add( id );
	currentPath.add( id );

	const dependencies = deps.get( id ) ?? new Set();

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
	currentPath.delete( id );
	return false;
}
