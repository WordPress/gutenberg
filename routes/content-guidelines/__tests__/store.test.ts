/**
 * Internal dependencies
 */
import type { ContentGuidelinesState, RestGuidelinesResponse } from '../types';

// Mock store creation and registration
jest.mock( '@wordpress/data', () => ( {
	createReduxStore: jest.fn( ( name, config ) => ( {
		reducer: config.reducer,
		actions: config.actions,
		selectors: config.selectors,
	} ) ),
	register: jest.fn(),
} ) );

// Import after mocking
import { store } from '../store';

describe( 'Content Guidelines Store - Unit Tests (Selectors, Reducers, Actions)', () => {
	let reducer: (
		state: ContentGuidelinesState | undefined,
		action: any
	) => ContentGuidelinesState;
	let actions: Record< string, any >;
	let selectors: Record< string, any >;

	beforeEach( () => {
		if ( store && typeof store === 'object' ) {
			reducer = ( store as any ).reducer;
			actions = ( store as any ).actions;
			selectors = ( store as any ).selectors;
		}
	} );

	/**
	 * Initialize a fresh default state.
	 */
	function createInitialState(): ContentGuidelinesState {
		return reducer( undefined, { type: '__INIT__' } );
	}

	describe( 'Selectors', () => {
		describe( 'getId', () => {
			test( 'returns the ID from state', () => {
				const state: ContentGuidelinesState = {
					id: 42,
					status: 'publish',
					categories: {
						site: 'Site Guidelines',
						copy: '',
						images: '',
						additional: '',
						blocks: {},
					},
				};

				const result = selectors.getId( state );
				expect( result ).toBe( 42 );
			} );

			test( 'returns null when ID is not set', () => {
				const state: ContentGuidelinesState = {
					id: null,
					status: 'draft',
					categories: {
						site: '',
						copy: '',
						images: '',
						additional: '',
						blocks: {},
					},
				};

				const result = selectors.getId( state );
				expect( result ).toBeNull();
			} );
		} );

		describe( 'getStatus', () => {
			test( 'returns the status from state', () => {
				const state: ContentGuidelinesState = {
					id: 1,
					status: 'publish',
					categories: {
						site: '',
						copy: '',
						images: '',
						additional: '',
						blocks: {},
					},
				};

				const result = selectors.getStatus( state );
				expect( result ).toBe( 'publish' );
			} );

			test( 'returns null when status is not set', () => {
				const state: ContentGuidelinesState = {
					id: 1,
					status: null,
					categories: {
						site: '',
						copy: '',
						images: '',
						additional: '',
						blocks: {},
					},
				};

				const result = selectors.getStatus( state );
				expect( result ).toBeNull();
			} );
		} );

		describe( 'getGuideline', () => {
			const baseState: ContentGuidelinesState = {
				id: 1,
				status: 'publish',
				categories: {
					site: 'Site guideline text',
					copy: 'Copy guideline text',
					images: 'Image guideline text',
					additional: 'Additional guideline text',
					blocks: {
						'core/paragraph': 'Paragraph guidelines',
						'core/heading': 'Heading guidelines',
					},
				},
			};

			test( 'returns text guideline for a category', () => {
				expect( selectors.getGuideline( baseState, 'site' ) ).toBe(
					'Site guideline text'
				);
				expect( selectors.getGuideline( baseState, 'copy' ) ).toBe(
					'Copy guideline text'
				);
				expect( selectors.getGuideline( baseState, 'images' ) ).toBe(
					'Image guideline text'
				);
				expect(
					selectors.getGuideline( baseState, 'additional' )
				).toBe( 'Additional guideline text' );
			} );

			test( 'returns block guidelines object for blocks category', () => {
				const result = selectors.getGuideline( baseState, 'blocks' );
				expect( result ).toEqual( {
					'core/paragraph': 'Paragraph guidelines',
					'core/heading': 'Heading guidelines',
				} );
			} );

			test( 'returns empty string for missing guideline', () => {
				const state = createInitialState();
				const result = selectors.getGuideline( state, 'site' );
				expect( result ).toBe( '' );
			} );
		} );

		describe( 'getAllGuidelines', () => {
			test( 'returns all guidelines in categories object', () => {
				const state: ContentGuidelinesState = {
					id: 1,
					status: 'publish',
					categories: {
						site: 'Site',
						copy: 'Copy',
						images: 'Images',
						additional: 'Additional',
						blocks: { 'core/test': 'Test' },
					},
				};

				const result = selectors.getAllGuidelines( state );
				expect( result ).toEqual( state.categories );
				expect( result ).toHaveProperty( 'site', 'Site' );
				expect( result ).toHaveProperty( 'copy', 'Copy' );
				expect( result ).toHaveProperty( 'images', 'Images' );
				expect( result ).toHaveProperty( 'additional', 'Additional' );
				expect( result ).toHaveProperty( 'blocks' );
			} );
		} );

		describe( 'getBlockGuidelines', () => {
			test( 'returns all block guidelines', () => {
				const state: ContentGuidelinesState = {
					id: 1,
					status: 'publish',
					categories: {
						site: '',
						copy: '',
						images: '',
						additional: '',
						blocks: {
							'core/paragraph': 'Paragraph',
							'core/heading': 'Heading',
							'core/image': 'Image',
						},
					},
				};

				const result = selectors.getBlockGuidelines( state );
				expect( result ).toEqual( {
					'core/paragraph': 'Paragraph',
					'core/heading': 'Heading',
					'core/image': 'Image',
				} );
			} );

			test( 'returns empty object when no blocks are set', () => {
				const state = createInitialState();
				const result = selectors.getBlockGuidelines( state );
				expect( result ).toEqual( {} );
			} );
		} );

		describe( 'getBlockGuideline', () => {
			test( 'returns a specific block guideline', () => {
				const state: ContentGuidelinesState = {
					id: 1,
					status: 'publish',
					categories: {
						site: '',
						copy: '',
						images: '',
						additional: '',
						blocks: {
							'core/paragraph': 'Paragraph guidelines',
							'core/heading': 'Heading guidelines',
						},
					},
				};

				expect(
					selectors.getBlockGuideline( state, 'core/paragraph' )
				).toBe( 'Paragraph guidelines' );
				expect(
					selectors.getBlockGuideline( state, 'core/heading' )
				).toBe( 'Heading guidelines' );
			} );

			test( 'returns empty string for non-existent block', () => {
				const state: ContentGuidelinesState = {
					id: 1,
					status: 'publish',
					categories: {
						site: '',
						copy: '',
						images: '',
						additional: '',
						blocks: {},
					},
				};

				const result = selectors.getBlockGuideline(
					state,
					'core/nonexistent'
				);
				expect( result ).toBe( '' );
			} );
		} );
	} );

	describe( 'Action Creators', () => {
		describe( 'setFromResponse', () => {
			test( 'creates action with response payload', () => {
				const response: RestGuidelinesResponse = {
					id: 5,
					status: 'draft',
					guideline_categories: {
						site: { guidelines: 'Site' },
						copy: { guidelines: 'Copy' },
						images: { guidelines: 'Images' },
						additional: { guidelines: 'Additional' },
					},
				};

				const action = actions.setFromResponse( response );

				expect( action.type ).toBe( 'SET_FROM_RESPONSE' );
				expect( action.response ).toBe( response );
			} );
		} );

		describe( 'setGuideline', () => {
			test( 'creates action with category and value', () => {
				const action = actions.setGuideline(
					'site',
					'New site content'
				);

				expect( action.type ).toBe( 'SET_GUIDELINE' );
				expect( action.category ).toBe( 'site' );
				expect( action.value ).toBe( 'New site content' );
			} );
		} );

		describe( 'setBlockGuideline', () => {
			test( 'creates action with block name and value', () => {
				const action = actions.setBlockGuideline(
					'core/paragraph',
					'Paragraph content'
				);

				expect( action.type ).toBe( 'SET_BLOCK_GUIDELINE' );
				expect( action.blockName ).toBe( 'core/paragraph' );
				expect( action.value ).toBe( 'Paragraph content' );
			} );
		} );
	} );

	describe( 'Reducer - Immutability & Edge Cases', () => {
		test( 'does not mutate state object references', () => {
			let state = createInitialState();
			const previousState = state;

			state = reducer(
				state,
				actions.setGuideline( 'site', 'New content' )
			);

			// Should create a new state object
			expect( state ).not.toBe( previousState );
		} );

		test( 'returns unchanged state for unknown action', () => {
			let state = createInitialState();
			state.categories = {
				site: 'Site',
				copy: 'Copy',
				images: 'Images',
				additional: 'Additional',
				blocks: {},
			};

			const previousCategories = state.categories;
			state = reducer( state, { type: 'UNKNOWN_ACTION' } );

			expect( state.categories ).toBe( previousCategories );
		} );
	} );
} );
