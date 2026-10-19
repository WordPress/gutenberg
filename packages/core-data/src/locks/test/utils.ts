import { describe, expect, it } from 'vitest';
import deepFreeze from 'deep-freeze';
import {
	getNode,
	iteratePath,
	iterateDescendants,
	hasConflictingLock,
	deepCopyLocksTreePath,
} from '../utils';
import type { Lock, LockNode } from '../types';

type DeepPartial< T > = { [ K in keyof T ]?: DeepPartial< T[ K ] > };

/**
 * Types a fixture that holds only the fields the code under test reads.
 *
 * @param value The partial fixture.
 */
function partial< T >( value: DeepPartial< T > ): T {
	return value as T;
}

/**
 * Freezes a partial fixture to catch mutations, keeping it writable to the
 * type checker as the code under test expects.
 *
 * @param value The partial fixture.
 */
function frozen< T >( value: DeepPartial< T > ): T {
	return deepFreeze( value ) as T;
}

describe( 'getNode', () => {
	const tree = frozen< LockNode >( {
		locks: [],
		children: {
			target: {
				locks: [],
				children: {},
			},
		},
	} );

	it( 'Returns a specified node from the tree', () => {
		expect( getNode( tree, [] ) ).toBe( tree );
		expect( getNode( tree, [ 'target' ] ) ).toBe( tree.children.target );
	} );
	it( 'Returns null when specified node does not exist', () => {
		expect( getNode( tree, [ 'fake' ] ) ).toBe( null );
	} );
} );

describe( 'iteratePath', () => {
	const buildNode = ( children = {} ) => ( {
		locks: [],
		children,
	} );
	const red = buildNode();
	const blue = buildNode();
	const green = buildNode();
	const bird = buildNode( { red, blue, green } );
	const target = buildNode( { bird } );
	const tree = frozen< LockNode >( buildNode( { target } ) );

	it( 'Is a generator', () => {
		const isGenerator = [
			'GeneratorFunction',
			'AsyncGeneratorFunction',
		].includes( iteratePath.constructor.name );
		expect( isGenerator ).toBe( true );
	} );

	it( 'Yields the root first', () => {
		expect(
			Array.from( iteratePath( tree, [ 'target', 'bird' ] ) )[ 0 ]
		).toEqual( tree );
	} );

	it( 'Iterates over a specified tree path', () => {
		expect(
			Array.from( iteratePath( tree, [ 'target', 'bird', 'green' ] ) )
		).toEqual( [ tree, target, bird, green ] );
	} );

	it( 'Yields just the root if the path is empty', () => {
		expect( Array.from( iteratePath( tree, [] ) ) ).toEqual( [ tree ] );
	} );

	it( 'Yields only the accessible nodes in the path', () => {
		expect(
			Array.from( iteratePath( tree, [ 'target', 'bird', 'fake' ] ) )
		).toEqual( [ tree, target, bird ] );
	} );
} );

describe( 'iterateDescendants', () => {
	const buildNode = ( children = {} ) => ( {
		locks: [],
		children,
	} );
	const red = buildNode();
	const blue = buildNode();
	const green = buildNode();
	const bird = buildNode( { red, blue, green } );
	const big = buildNode();
	const small = buildNode();
	const large = buildNode();
	const house = buildNode( { big, small, large } );

	const tree = buildNode( { bird, house } );

	it( 'Is a generator', () => {
		const isGenerator = [
			'GeneratorFunction',
			'AsyncGeneratorFunction',
		].includes( iterateDescendants.constructor.name );
		expect( isGenerator ).toBe( true );
	} );

	it( 'Yields nothing when no children are available', () => {
		expect( Array.from( iterateDescendants( red ) ) ).toEqual( [] );
	} );

	it( 'Yields children when there is just one level of nesting', () => {
		const results = Array.from( iterateDescendants( bird ) );
		expect( results ).toHaveLength( 3 );
		expect( results ).toEqual(
			expect.arrayContaining( [ red, blue, green ] )
		);
	} );

	it( 'Yields all descendants when ran on deep structure', () => {
		const results = Array.from( iterateDescendants( tree ) );
		expect( results ).toHaveLength( 8 );
		expect( results ).toEqual(
			expect.arrayContaining( [
				bird,
				red,
				blue,
				green,
				house,
				big,
				small,
				green,
			] )
		);
	} );
} );

describe( 'hasConflictingLock', () => {
	it( 'Returns false when requesting an exclusive lock and no locks are present', () => {
		expect( hasConflictingLock( { exclusive: true }, [] ) ).toBe( false );
	} );
	it( 'Returns true when requesting an exclusive lock and any locks at all are present', () => {
		expect(
			hasConflictingLock( { exclusive: true }, [
				partial< Lock >( { exclusive: false } ),
			] )
		).toBe( true );
		expect(
			hasConflictingLock( { exclusive: true }, [
				partial< Lock >( { exclusive: true } ),
			] )
		).toBe( true );
	} );

	it( 'Returns false when requesting a shared lock and no locks are present', () => {
		expect( hasConflictingLock( { exclusive: false }, [] ) ).toBe( false );
	} );

	it( 'Returns false when requesting a shared lock and only shared locks at all are present', () => {
		expect(
			hasConflictingLock( { exclusive: false }, [
				partial< Lock >( { exclusive: false } ),
			] )
		).toBe( false );
		expect(
			hasConflictingLock( { exclusive: false }, [
				partial< Lock >( { exclusive: false } ),
				partial< Lock >( { exclusive: false } ),
				partial< Lock >( { exclusive: false } ),
			] )
		).toBe( false );
	} );

	it( 'Returns true when requesting a shared lock and any exclusive shared locks at all are present', () => {
		expect(
			hasConflictingLock( { exclusive: false }, [
				partial< Lock >( { exclusive: true } ),
			] )
		).toBe( true );
		expect(
			hasConflictingLock( { exclusive: false }, [
				partial< Lock >( { exclusive: false } ),
				partial< Lock >( { exclusive: true } ),
				partial< Lock >( { exclusive: false } ),
			] )
		).toBe( true );
	} );
} );

describe( 'deepCopyLocksTreePath', () => {
	it( 'Returns a tree with a cloned path', () => {
		const tree = frozen< LockNode >( {
			locks: [ { exclusive: true } ],
			children: {
				target: {
					locks: [],
					children: {},
				},
			},
		} );

		const deepCopy = deepCopyLocksTreePath( tree, [ 'target' ] );
		expect( deepCopy ).toMatchObject( tree );
		// Path to the target node should be cloned (named branches and their `children` containers)
		expect( deepCopy.children ).not.toBe( tree.children );
		expect( deepCopy.children.target ).not.toBe( tree.children.target );

		// Locks lists should be preserved.
		expect( deepCopy.locks ).toBe( tree.locks );
		expect( deepCopy.children.target.locks ).toBe(
			tree.children.target.locks
		);

		// Specific locks should be preserved.
		expect( deepCopy.locks[ 0 ] ).toBe( tree.locks[ 0 ] );

		// No need to clone lower levels of the tree, let's check if they're still the same:
		expect( deepCopy.children.target.children ).toBe(
			tree.children.target.children
		);
	} );

	it( 'Creates missing branches', () => {
		const tree = frozen< LockNode >( {
			locks: [ { exclusive: true } ],
			children: {
				target: {
					locks: [],
					children: {},
				},
			},
		} );

		const deepCopy = deepCopyLocksTreePath(
			tree,
			[ 'target', 'bird', 'blue' ],
			// @ts-expect-error The function has no options: it always creates missing branches.
			{
				createMissing: true,
			}
		);
		const target = deepCopy.children.target;
		expect( Object.keys( target.children ) ).toEqual( [ 'bird' ] );
		expect( Object.keys( target.children.bird ) ).toEqual( [
			'locks',
			'children',
		] );
		expect( Object.keys( target.children.bird.children ) ).toEqual( [
			'blue',
		] );
		expect( Object.keys( target.children.bird.children.blue ) ).toEqual( [
			'locks',
			'children',
		] );
	} );
} );
