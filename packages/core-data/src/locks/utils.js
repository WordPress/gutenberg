export function deepCopyLocksTreePath( tree, path ) {
	const newTree = { ...tree };
	let currentNode = newTree;
	for ( const branchName of path ) {
		currentNode.children = {
			...currentNode.children,
			[ branchName ]: {
				locks: [],
				children: {},
				...currentNode.children[ branchName ],
			},
		};
		currentNode = currentNode.children[ branchName ];
	}
	return newTree;
}

export function getNode( tree, path ) {
	let currentNode = tree;
	for ( const branchName of path ) {
		const nextNode = currentNode.children[ branchName ];
		if ( ! nextNode ) {
			return null;
		}
		currentNode = nextNode;
	}
	return currentNode;
}

export function* iteratePath( tree, path ) {
	let currentNode = tree;
	yield currentNode;
	for ( const branchName of path ) {
		const nextNode = currentNode.children[ branchName ];
		if ( ! nextNode ) {
			break;
		}
		yield nextNode;
		currentNode = nextNode;
	}
}

export function* iterateDescendants( node ) {
	const stack = Object.values( node.children );
	while ( stack.length ) {
		const childNode = stack.pop();
		yield childNode;
		stack.push( ...Object.values( childNode.children ) );
	}
}

export function hasConflictingLock( { exclusive }, locks ) {
	if ( exclusive && locks.length ) {
		return true;
	}

	if ( ! exclusive && locks.filter( ( lock ) => lock.exclusive ).length ) {
		return true;
	}

	return false;
}
