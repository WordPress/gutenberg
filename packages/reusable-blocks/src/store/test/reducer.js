/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reusableBlocks from '../reducer';

describe( 'state', () => {
	it( 'should start out empty', () => {
		const state = reusableBlocks( undefined, {} );
		expect( state ).toEqual( {
			data: {},
			isFetching: {},
			isSaving: {},
			optimist: [],
		} );
	} );

	it( 'should add received reusable blocks', () => {
		const state = reusableBlocks(
			{},
			{
				type: 'RECEIVE_REUSABLE_BLOCKS',
				results: [
					{
						id: 123,
						title: 'My cool block',
					},
				],
			}
		);

		expect( state ).toEqual( {
			data: {
				123: { id: 123, title: 'My cool block' },
			},
			isFetching: {},
			isSaving: {},
			optimist: [],
		} );
	} );

	it( 'should update a reusable block', () => {
		const initialState = {
			data: {
				123: { clientId: '', title: '' },
			},
			isFetching: {},
			isSaving: {},
			optimist: [],
		};

		const state = reusableBlocks( initialState, {
			type: 'UPDATE_REUSABLE_BLOCK',
			id: 123,
			changes: {
				title: 'My block',
			},
		} );

		expect( state ).toEqual( {
			data: {
				123: { clientId: '', title: 'My block' },
			},
			isFetching: {},
			isSaving: {},
			optimist: [],
		} );
	} );

	it( "should update the reusable block's id if it was temporary", () => {
		const initialState = {
			data: {
				reusable1: { id: 'reusable1', title: '' },
			},
			isSaving: {},
			optimist: [],
		};

		const state = reusableBlocks( initialState, {
			type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
			id: 'reusable1',
			updatedId: 123,
		} );

		expect( state ).toEqual( {
			data: {
				123: { id: 123, title: '' },
			},
			isFetching: {},
			isSaving: {},
			optimist: [],
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
			optimist: [],
		};

		const state = reusableBlocks( deepFreeze( initialState ), {
			type: 'REMOVE_REUSABLE_BLOCK',
			id,
		} );

		expect( state ).toEqual( {
			data: {},
			isFetching: {},
			isSaving: {},
			optimist: [],
		} );
	} );

	it( 'should indicate that a reusable block is fetching', () => {
		const id = 123;
		const initialState = {
			data: {},
			isFetching: {},
			isSaving: {},
			optimist: [],
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
			optimist: [],
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
			optimist: [],
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
			optimist: [],
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
			optimist: [],
		};

		const state = reusableBlocks( initialState, {
			type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
			id,
		} );

		expect( state ).toEqual( {
			data: {},
			isFetching: {},
			isSaving: {},
			optimist: [],
		} );
	} );

	it( 'should indicate that a reusable block is saving', () => {
		const id = 123;
		const initialState = {
			data: {},
			isFetching: {},
			isSaving: {},
			optimist: [],
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
			optimist: [],
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
			optimist: [],
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
			optimist: [],
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
			optimist: [],
		};

		const state = reusableBlocks( initialState, {
			type: 'SAVE_REUSABLE_BLOCK_FAILURE',
			id,
		} );

		expect( state ).toEqual( {
			data: {},
			isFetching: {},
			isSaving: {},
			optimist: [],
		} );
	} );
} );
