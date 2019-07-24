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
	initialEdits,
	editor,
	currentPost,
	preferences,
	saving,
	reusableBlocks,
	postSavingLock,
	previewLink,
} from '../reducer';
import { INITIAL_EDITS_DEFAULTS } from '../defaults';

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

			expect( isUpdatingSamePostProperty( action, previousAction ) ).toBe( false );
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

			expect( isUpdatingSamePostProperty( action, previousAction ) ).toBe( false );
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

			expect( isUpdatingSamePostProperty( action, previousAction ) ).toBe( true );
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

			expect( shouldOverwriteState( action, previousAction ) ).toBe( false );
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

			expect( shouldOverwriteState( action, previousAction ) ).toBe( false );
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

			expect( shouldOverwriteState( action, previousAction ) ).toBe( true );
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

	describe( 'editor()', () => {
		describe( 'blocks()', () => {
			it( 'should set its value by RESET_EDITOR_BLOCKS', () => {
				const blocks = [ {
					clientId: 'block3',
					innerBlocks: [
						{ clientId: 'block31', innerBlocks: [] },
						{ clientId: 'block32', innerBlocks: [] },
					],
				} ];
				const state = editor( undefined, {
					type: 'RESET_EDITOR_BLOCKS',
					blocks,
				} );

				expect( state.present.blocks.value ).toBe( blocks );
			} );
		} );

		describe( 'edits()', () => {
			it( 'should save newly edited properties', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						tags: [ 1 ],
					},
				} );

				expect( state.present.edits ).toEqual( {
					status: 'draft',
					title: 'post title',
					tags: [ 1 ],
				} );
			} );

			it( 'should return same reference if no changed properties', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
					},
				} );

				expect( state.present.edits ).toBe( original.present.edits );
			} );

			it( 'should save modified properties', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						status: 'draft',
						title: 'post title',
						tags: [ 1 ],
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						title: 'modified title',
						tags: [ 2 ],
					},
				} );

				expect( state.present.edits ).toEqual( {
					status: 'draft',
					title: 'modified title',
					tags: [ 2 ],
				} );
			} );

			it( 'should merge object values', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						meta: {
							a: 1,
						},
					},
				} );

				const state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						meta: {
							b: 2,
						},
					},
				} );

				expect( state.present.edits ).toEqual( {
					meta: {
						a: 1,
						b: 2,
					},
				} );
			} );

			it( 'return state by reference on unchanging update', () => {
				const original = editor( undefined, {} );

				const state = editor( original, {
					type: 'UPDATE_POST',
					edits: {},
				} );

				expect( state.present.edits ).toBe( original.present.edits );
			} );

			it( 'unset reset post values which match by canonical value', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						title: 'modified title',
					},
				} );

				const state = editor( original, {
					type: 'RESET_POST',
					post: {
						title: {
							raw: 'modified title',
						},
					},
				} );

				expect( state.present.edits ).toEqual( {} );
			} );

			it( 'unset reset post values by deep match', () => {
				const original = editor( undefined, {
					type: 'EDIT_POST',
					edits: {
						title: 'modified title',
						meta: {
							a: 1,
							b: 2,
						},
					},
				} );

				const state = editor( original, {
					type: 'UPDATE_POST',
					edits: {
						title: 'modified title',
						meta: {
							a: 1,
							b: 2,
						},
					},
				} );

				expect( state.present.edits ).toEqual( {} );
			} );

			it( 'should omit content when resetting', () => {
				// Use case: When editing in Text mode, we defer to content on
				// the property, but we reset blocks by parse when switching
				// back to Visual mode.
				const original = deepFreeze( editor( undefined, {} ) );
				let state = editor( original, {
					type: 'EDIT_POST',
					edits: {
						content: 'bananas',
					},
				} );

				expect( state.present.edits ).toHaveProperty( 'content' );

				state = editor( original, {
					type: 'RESET_EDITOR_BLOCKS',
					blocks: [ {
						clientId: 'kumquat',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					}, {
						clientId: 'loquat',
						name: 'core/test-block',
						attributes: {},
						innerBlocks: [],
					} ],
				} );

				expect( state.present.edits ).not.toHaveProperty( 'content' );
			} );
		} );
	} );

	describe( 'initialEdits', () => {
		it( 'should default to initial edits', () => {
			const state = initialEdits( undefined, {} );

			expect( state ).toBe( INITIAL_EDITS_DEFAULTS );
		} );

		it( 'should return initial edits on post reset', () => {
			const state = initialEdits( undefined, {
				type: 'RESET_POST',
			} );

			expect( state ).toBe( INITIAL_EDITS_DEFAULTS );
		} );

		it( 'should return referentially equal state if setup includes no edits', () => {
			const original = initialEdits( undefined, {} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'SETUP_EDITOR',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should return referentially equal state if reset while having made no edits', () => {
			const original = initialEdits( undefined, {} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'RESET_POST',
			} );

			expect( state ).toBe( original );
		} );

		it( 'should return setup edits', () => {
			const original = initialEdits( undefined, {} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'SETUP_EDITOR',
				edits: {
					title: '',
					content: '',
				},
			} );

			expect( state ).toEqual( {
				title: '',
				content: '',
			} );
		} );

		it( 'should unset content on editor setup', () => {
			const original = initialEdits( undefined, {
				type: 'SETUP_EDITOR',
				edits: {
					title: '',
					content: '',
				},
			} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'SETUP_EDITOR_STATE',
			} );

			expect( state ).toEqual( { title: '' } );
		} );

		it( 'should unset values on post update', () => {
			const original = initialEdits( undefined, {
				type: 'SETUP_EDITOR',
				edits: {
					title: '',
				},
			} );
			const state = initialEdits( deepFreeze( original ), {
				type: 'UPDATE_POST',
				edits: {
					title: '',
				},
			} );

			expect( state ).toEqual( {} );
		} );
	} );

	describe( 'currentPost()', () => {
		it( 'should reset a post object', () => {
			const original = deepFreeze( { title: 'unmodified' } );

			const state = currentPost( original, {
				type: 'RESET_POST',
				post: {
					title: 'new post',
				},
			} );

			expect( state ).toEqual( {
				title: 'new post',
			} );
		} );

		it( 'should update the post object with UPDATE_POST', () => {
			const original = deepFreeze( { title: 'unmodified', status: 'publish' } );

			const state = currentPost( original, {
				type: 'UPDATE_POST',
				edits: {
					title: 'updated post object from server',
				},
			} );

			expect( state ).toEqual( {
				title: 'updated post object from server',
				status: 'publish',
			} );
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
			const original = deepFreeze( preferences( undefined, { } ) );
			const state = preferences( original, {
				type: 'DISABLE_PUBLISH_SIDEBAR',
			} );

			expect( state.isPublishSidebarEnabled ).toBe( false );
		} );

		it( 'should enable the publish sidebar', () => {
			const original = deepFreeze( preferences( { isPublishSidebarEnabled: false }, { } ) );
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
			} );
			expect( state ).toEqual( {
				requesting: true,
				successful: false,
				error: null,
				options: {},
			} );
		} );

		it( 'should update when a request succeeds', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
			} );
			expect( state ).toEqual( {
				requesting: false,
				successful: true,
				error: null,
				options: {},
			} );
		} );

		it( 'should update when a request fails', () => {
			const state = saving( null, {
				type: 'REQUEST_POST_UPDATE_FAILURE',
				error: {
					code: 'pretend_error',
					message: 'update failed',
				},
			} );
			expect( state ).toEqual( {
				requesting: false,
				successful: false,
				error: {
					code: 'pretend_error',
					message: 'update failed',
				},
				options: {},
			} );
		} );
	} );

	describe( 'reusableBlocks()', () => {
		it( 'should start out empty', () => {
			const state = reusableBlocks( undefined, {} );
			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should add received reusable blocks', () => {
			const state = reusableBlocks( {}, {
				type: 'RECEIVE_REUSABLE_BLOCKS',
				results: [ {
					reusableBlock: {
						id: 123,
						title: 'My cool block',
					},
					parsedBlock: {
						clientId: 'foo',
					},
				} ],
			} );

			expect( state ).toEqual( {
				data: {
					123: { clientId: 'foo', title: 'My cool block' },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should update a reusable block', () => {
			const initialState = {
				data: {
					123: { clientId: '', title: '' },
				},
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'UPDATE_REUSABLE_BLOCK_TITLE',
				id: 123,
				title: 'My block',
			} );

			expect( state ).toEqual( {
				data: {
					123: { clientId: '', title: 'My block' },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( "should update the reusable block's id if it was temporary", () => {
			const initialState = {
				data: {
					reusable1: { clientId: '', title: '' },
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id: 'reusable1',
				updatedId: 123,
			} );

			expect( state ).toEqual( {
				data: {
					123: { clientId: '', title: '' },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should remove a reusable block', () => {
			const id = 123;
			const initialState = {
				data: {
					[ id ]: {
						id,
						name: 'My cool block',
						type: 'core/paragraph',
						attributes: {
							content: 'Hello!',
							dropCap: true,
						},
					},
				},
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( deepFreeze( initialState ), {
				type: 'REMOVE_REUSABLE_BLOCK',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should indicate that a reusable block is fetching', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'FETCH_REUSABLE_BLOCKS',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {
					[ id ]: true,
				},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when the fetch succeeded', () => {
			const id = 123;
			const initialState = {
				data: {
					[ id ]: { id },
				},
				isFetching: {
					[ id ]: true,
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
				id,
				updatedId: id,
			} );

			expect( state ).toEqual( {
				data: {
					[ id ]: { id },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is fetching when there is an error', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {
					[ id ]: true,
				},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should indicate that a reusable block is saving', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {},
				isSaving: {},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {
					[ id ]: true,
				},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when the save succeeded', () => {
			const id = 123;
			const initialState = {
				data: {
					[ id ]: { id },
				},
				isFetching: {},
				isSaving: {
					[ id ]: true,
				},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				id,
				updatedId: id,
			} );

			expect( state ).toEqual( {
				data: {
					[ id ]: { id },
				},
				isFetching: {},
				isSaving: {},
			} );
		} );

		it( 'should stop indicating that a reusable block is saving when there is an error', () => {
			const id = 123;
			const initialState = {
				data: {},
				isFetching: {},
				isSaving: {
					[ id ]: true,
				},
			};

			const state = reusableBlocks( initialState, {
				type: 'SAVE_REUSABLE_BLOCK_FAILURE',
				id,
			} );

			expect( state ).toEqual( {
				data: {},
				isFetching: {},
				isSaving: {},
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

	describe( 'previewLink', () => {
		it( 'returns null by default', () => {
			const state = previewLink( undefined, {} );

			expect( state ).toBe( null );
		} );

		it( 'returns preview link from save success', () => {
			const state = previewLink( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				post: {
					preview_link: 'https://example.com/?p=2611&preview=true',
				},
			} );

			expect( state ).toBe( 'https://example.com/?p=2611&preview=true' );
		} );

		it( 'returns post link with query arg from save success if no preview link', () => {
			const state = previewLink( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				post: {
					link: 'https://example.com/sample-post/',
				},
			} );

			expect( state ).toBe( 'https://example.com/sample-post/?preview=true' );
		} );

		it( 'returns same state if save success without preview link or post link', () => {
			// Bug: This can occur for post types which are defined as
			// `publicly_queryable => false` (non-viewable).
			//
			// See: https://github.com/WordPress/gutenberg/issues/12677
			const state = previewLink( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				post: {
					preview_link: '',
				},
			} );

			expect( state ).toBe( null );
		} );

		it( 'returns resets on preview start', () => {
			const state = previewLink( 'https://example.com/sample-post/', {
				type: 'REQUEST_POST_UPDATE_START',
				options: {
					isPreview: true,
				},
			} );

			expect( state ).toBe( null );
		} );

		it( 'returns state on non-preview save start', () => {
			const state = previewLink( 'https://example.com/sample-post/', {
				type: 'REQUEST_POST_UPDATE_START',
				options: {},
			} );

			expect( state ).toBe( 'https://example.com/sample-post/' );
		} );
	} );
} );
