/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	hasSameKeys,
	isUpdatingSamePostProperty,
	shouldOverwriteState,
	getPostRawValue,
	preferences,
	saving,
	postSavingLock,
	postAutosavingLock,
} from '../reducer';

describe( 'state', () => {
	describe( 'hasSameKeys()', () => {
		it( 'returns false if two objects do not have the same keys', () => {
			const a = { foo: 10 };
			const b = { bar: 10 };

			expect( hasSameKeys( a, b ) ).toBe( false );
		} );

		it( 'returns false if two objects have the same keys', () => {
			const a = { foo: 10 };
			const b = { foo: 20 };

			expect( hasSameKeys( a, b ) ).toBe( true );
		} );
	} );

	describe( 'isUpdatingSamePostProperty()', () => {
		it( 'should return false if not editing post', () => {
			const action = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				attributes: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'UPDATE_BLOCK_ATTRIBUTES',
				clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
				attributes: {
					foo: 10,
				},
			};

			expect( isUpdatingSamePostProperty( action, previousAction ) ).toBe(
				false
			);
		} );

		it( 'should return false if not editing the same post properties', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'EDIT_POST',
				edits: {
					bar: 20,
				},
			};

			expect( isUpdatingSamePostProperty( action, previousAction ) ).toBe(
				false
			);
		} );

		it( 'should return true if updating the same post properties', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'EDIT_POST',
				edits: {
					foo: 20,
				},
			};

			expect( isUpdatingSamePostProperty( action, previousAction ) ).toBe(
				true
			);
		} );
	} );

	describe( 'shouldOverwriteState()', () => {
		it( 'should return false if no previous action', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = undefined;

			expect( shouldOverwriteState( action, previousAction ) ).toBe(
				false
			);
		} );

		it( 'should return false if the action types are different', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'EDIT_DIFFERENT_POST',
				edits: {
					foo: 20,
				},
			};

			expect( shouldOverwriteState( action, previousAction ) ).toBe(
				false
			);
		} );

		it( 'should return true if updating same post property', () => {
			const action = {
				type: 'EDIT_POST',
				edits: {
					foo: 10,
				},
			};
			const previousAction = {
				type: 'EDIT_POST',
				edits: {
					foo: 20,
				},
			};

			expect( shouldOverwriteState( action, previousAction ) ).toBe(
				true
			);
		} );
	} );

	describe( 'getPostRawValue', () => {
		it( 'returns original value for non-rendered content', () => {
			const value = getPostRawValue( '' );

			expect( value ).toBe( '' );
		} );

		it( 'returns raw value for rendered content', () => {
			const value = getPostRawValue( { raw: '' } );

			expect( value ).toBe( '' );
		} );
	} );

	describe( 'preferences()', () => {
		it( 'should apply all defaults', () => {
			const state = preferences( undefined, {} );
			expect( state ).toEqual( {
				insertUsage: {},
				isPublishSidebarEnabled: true,
			} );
		} );

		it( 'should disable the publish sidebar', () => {
			const original = deepFreeze( preferences( undefined, {} ) );
			const state = preferences( original, {
				type: 'DISABLE_PUBLISH_SIDEBAR',
			} );

			expect( state.isPublishSidebarEnabled ).toBe( false );
		} );

		it( 'should enable the publish sidebar', () => {
			const original = deepFreeze(
				preferences( { isPublishSidebarEnabled: false }, {} )
			);
			const state = preferences( original, {
				type: 'ENABLE_PUBLISH_SIDEBAR',
			} );

			expect( state.isPublishSidebarEnabled ).toBe( true );
		} );
	} );

	describe( 'saving()', () => {
		it( 'should update when a request is started', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_START',
				options: { isAutosave: true },
			} );
			expect( state ).toEqual( {
				pending: true,
				options: { isAutosave: true },
			} );
		} );
	} );

	describe( 'postSavingLock', () => {
		it( 'returns empty object by default', () => {
			const state = postSavingLock( undefined, {} );

			expect( state ).toEqual( {} );
		} );

		it( 'returns correct post locks when locks added and removed', () => {
			let state = postSavingLock( undefined, {
				type: 'LOCK_POST_SAVING',
				lockName: 'test-lock',
			} );

			expect( state ).toEqual( {
				'test-lock': true,
			} );

			state = postSavingLock( deepFreeze( state ), {
				type: 'LOCK_POST_SAVING',
				lockName: 'test-lock-2',
			} );

			expect( state ).toEqual( {
				'test-lock': true,
				'test-lock-2': true,
			} );

			state = postSavingLock( deepFreeze( state ), {
				type: 'UNLOCK_POST_SAVING',
				lockName: 'test-lock',
			} );

			expect( state ).toEqual( {
				'test-lock-2': true,
			} );

			state = postSavingLock( deepFreeze( state ), {
				type: 'UNLOCK_POST_SAVING',
				lockName: 'test-lock-2',
			} );

			expect( state ).toEqual( {} );
		} );
	} );

	describe( 'postAutosavingLock', () => {
		it( 'returns empty object by default', () => {
			const state = postAutosavingLock( undefined, {} );

			expect( state ).toEqual( {} );
		} );

		it( 'returns correct post locks when locks added and removed', () => {
			let state = postAutosavingLock( undefined, {
				type: 'LOCK_POST_AUTOSAVING',
				lockName: 'test-lock',
			} );

			expect( state ).toEqual( {
				'test-lock': true,
			} );

			state = postAutosavingLock( deepFreeze( state ), {
				type: 'LOCK_POST_AUTOSAVING',
				lockName: 'test-lock-2',
			} );

			expect( state ).toEqual( {
				'test-lock': true,
				'test-lock-2': true,
			} );

			state = postAutosavingLock( deepFreeze( state ), {
				type: 'UNLOCK_POST_AUTOSAVING',
				lockName: 'test-lock',
			} );

			expect( state ).toEqual( {
				'test-lock-2': true,
			} );

			state = postAutosavingLock( deepFreeze( state ), {
				type: 'UNLOCK_POST_AUTOSAVING',
				lockName: 'test-lock-2',
			} );

			expect( state ).toEqual( {} );
		} );
	} );
} );
