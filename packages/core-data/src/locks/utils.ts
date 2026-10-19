import type { Lock, LockNode, LockPath } from './types';

export function deepCopyLocksTreePath(
	tree: LockNode,
	path: LockPath
): LockNode {
	const newTree = { ...tree };
	let currentNode = newTree;
	for ( const branchName of path ) {
		currentNode.children = {
			...currentNode.children,
			[ branchName ]: {
				locks: [],
				children: {},
				// The branch does not exist until a lock is first taken on it.
				...( currentNode.children[ branchName ] as
					LockNode | undefined ),
			},
		};
		currentNode = currentNode.children[ branchName ];
	}
	return newTree;
}

export function getNode( tree: LockNode, path: LockPath ): LockNode | null {
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

export function* iteratePath(
	tree: LockNode,
	path: LockPath
): Generator< LockNode > {
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

export function* iterateDescendants( node: LockNode ): Generator< LockNode > {
	const stack = Object.values( node.children );
	while ( stack.length ) {
		// The loop runs while the stack has nodes.
		const childNode = stack.pop()!;
		yield childNode;
		stack.push( ...Object.values( childNode.children ) );
	}
}

export function hasConflictingLock(
	{ exclusive }: { exclusive: boolean },
	locks: Lock[]
): boolean {
	if ( exclusive && locks.length ) {
		return true;
	}

	if ( ! exclusive && locks.filter( ( lock ) => lock.exclusive ).length ) {
		return true;
	}

	return false;
}
