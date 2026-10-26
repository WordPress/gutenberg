import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	executeAbility,
	getAbility,
	getAbilityCategory,
} from '@wordpress/abilities';
import { dispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	RENAME_POST_ABILITY,
	TRASH_POSTS_ABILITY,
	registerPostAbilities,
} from '../shared/abilities';
import { getFormFields } from '../shared/ability-action';
// Importing the collection registers the abilities.
import '../post_type_supports';

describe( 'post abilities', () => {
	afterEach( () => {
		vi.restoreAllMocks();
	} );

	it( 'registers the abilities and their category once', () => {
		expect( getAbilityCategory( 'content' ) ).toBeDefined();
		expect( getAbility( TRASH_POSTS_ABILITY )?.meta?.annotations ).toEqual(
			expect.objectContaining( {
				destructive: true,
				clientRegistered: true,
			} )
		);
		expect( getAbility( RENAME_POST_ABILITY ) ).toBeDefined();
		// Registering again does not throw.
		expect( () => registerPostAbilities() ).not.toThrow();
	} );

	it( 'validates the input against the schema', async () => {
		await expect(
			executeAbility( RENAME_POST_ABILITY, { id: 1, title: 'Hi' } )
		).rejects.toMatchObject( { code: 'ability_invalid_input' } );
	} );

	it( 'reports the posts it could not trash', async () => {
		vi.spyOn(
			dispatch( coreStore ),
			'deleteEntityRecord'
		).mockImplementation( ( async (
			_kind: string,
			_name: string,
			id: string
		) => {
			if ( id === '2' ) {
				throw { code: 'rest_cannot_delete', message: 'Nope.' };
			}
		} ) as any );
		const output = await getAbility( TRASH_POSTS_ABILITY )!.callback!( {
			post_type: 'page',
			ids: [ 1, 2 ],
		} );
		expect( output ).toEqual( {
			trashed: [ 1 ],
			failed: [ { id: 2, message: 'Nope.' } ],
		} );
	} );

	it( 'asks for the input the items do not provide', () => {
		expect(
			getFormFields( getAbility( RENAME_POST_ABILITY ), {
				post_type: 'page',
				id: 1,
			} )
		).toEqual( [ { name: 'title', label: 'Name', required: true } ] );
		expect(
			getFormFields( getAbility( TRASH_POSTS_ABILITY ), {
				post_type: 'page',
				ids: [ 1 ],
			} )
		).toEqual( [] );
	} );
} );
