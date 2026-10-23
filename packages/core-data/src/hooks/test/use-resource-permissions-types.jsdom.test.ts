/* eslint-disable vitest/expect-expect -- these tests contain compile-time assertions only. */
/* eslint-disable @typescript-eslint/no-unused-vars -- hook wrappers are only used to assert their inferred return types. */
import { describe, expectTypeOf, it } from 'vitest';
import useResourcePermissions from '../use-resource-permissions';
import type { Status } from '../constants';

type CollectionPermissions = {
	status: Status;
	isResolving: boolean;
	hasResolved: boolean;
	canCreate: boolean;
	canRead: boolean;
};

type ItemPermissions = CollectionPermissions & {
	canUpdate: boolean;
	canDelete: boolean;
};

// Compare assignability so equivalent object intersections are accepted.
type Equal< Actual, Expected > = [ Actual ] extends [ Expected ]
	? [ Expected ] extends [ Actual ]
		? true
		: false
	: false;

describe( 'useResourcePermissions types', () => {
	it( 'returns collection permissions for a REST base without an ID', () => {
		// Check the consumer signature without invoking a React hook.
		const usePermissions = () => useResourcePermissions( 'widgets' );
		expectTypeOf<
			Equal< ReturnType< typeof usePermissions >, CollectionPermissions >
		>().toEqualTypeOf< true >();
	} );

	it( 'returns item permissions for a REST base with an ID', () => {
		const usePermissions = () => useResourcePermissions( 'widgets', 1 );
		expectTypeOf<
			Equal< ReturnType< typeof usePermissions >, ItemPermissions >
		>().toEqualTypeOf< true >();
	} );

	it( 'returns collection permissions for a REST base with an undefined ID', () => {
		const usePermissions = () =>
			useResourcePermissions( 'widgets', undefined );
		expectTypeOf<
			Equal< ReturnType< typeof usePermissions >, CollectionPermissions >
		>().toEqualTypeOf< true >();
	} );

	it( 'does not require item permissions when the REST resource ID is optional', () => {
		const usePermissions = ( id: number | undefined ) =>
			useResourcePermissions( 'widgets', id );
		expectTypeOf<
			Equal<
				ReturnType< typeof usePermissions >,
				CollectionPermissions | ItemPermissions
			>
		>().toEqualTypeOf< true >();
	} );

	it( 'returns collection permissions for an entity without an ID', () => {
		const usePermissions = () =>
			useResourcePermissions( { kind: 'postType', name: 'page' } );
		expectTypeOf<
			Equal< ReturnType< typeof usePermissions >, CollectionPermissions >
		>().toEqualTypeOf< true >();
	} );

	it( 'returns collection permissions for an entity with an undefined ID', () => {
		const usePermissions = () =>
			useResourcePermissions( {
				kind: 'postType',
				name: 'page',
				id: undefined,
			} );
		expectTypeOf<
			Equal< ReturnType< typeof usePermissions >, CollectionPermissions >
		>().toEqualTypeOf< true >();
	} );

	it( 'returns item permissions for an entity with a numeric ID', () => {
		const usePermissions = () =>
			useResourcePermissions( { kind: 'postType', name: 'page', id: 1 } );
		expectTypeOf<
			Equal< ReturnType< typeof usePermissions >, ItemPermissions >
		>().toEqualTypeOf< true >();
	} );

	it( 'returns item permissions for an entity with a string ID', () => {
		const usePermissions = () =>
			useResourcePermissions( {
				kind: 'root',
				name: 'widget',
				id: 'text-1',
			} );
		expectTypeOf<
			Equal< ReturnType< typeof usePermissions >, ItemPermissions >
		>().toEqualTypeOf< true >();
	} );

	it( 'does not require item permissions when the entity ID is optional', () => {
		const usePermissions = ( resource: {
			kind: string;
			name: string;
			id?: number;
		} ) => useResourcePermissions( resource );
		expectTypeOf<
			Equal<
				ReturnType< typeof usePermissions >,
				CollectionPermissions | ItemPermissions
			>
		>().toEqualTypeOf< true >();
	} );
} );

/* eslint-enable vitest/expect-expect */
/* eslint-enable @typescript-eslint/no-unused-vars */
