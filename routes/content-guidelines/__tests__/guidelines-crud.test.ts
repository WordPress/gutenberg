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

describe( 'Content Guidelines Store - CRUD Operations', () => {
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
	function createInitialState() {
		return reducer( undefined, { type: 'INIT' } );
	}

	/**
	 * Apply a single guideline action to state.
	 * @param state    Current state
	 * @param category Category name ('site', 'copy', 'images', 'additional')
	 * @param value    Guideline text
	 */
	function setGuideline(
		state: ContentGuidelinesState,
		category: string,
		value: string
	): ContentGuidelinesState {
		return reducer( state, actions.setGuideline( category, value ) );
	}

	/**
	 * Apply a block guideline action to state.
	 * @param state     Current state
	 * @param blockName Block identifier (e.g., 'core/paragraph')
	 * @param value     Guideline text
	 */
	function setBlockGuideline(
		state: ContentGuidelinesState,
		blockName: string,
		value: string
	): ContentGuidelinesState {
		return reducer( state, actions.setBlockGuideline( blockName, value ) );
	}

	/**
	 * Apply response from API to state.
	 * @param state    Current state
	 * @param response API response containing guidelines
	 */
	function setFromResponse(
		state: ContentGuidelinesState,
		response: RestGuidelinesResponse
	): ContentGuidelinesState {
		return reducer( state, actions.setFromResponse( response ) );
	}

	describe( 'CREATE', () => {
		test( 'should add site guideline', () => {
			const state = createInitialState();
			const updated = setGuideline( state, 'site', 'Use clear language' );

			expect( selectors.getGuideline( updated, 'site' ) ).toBe(
				'Use clear language'
			);
		} );

		test( 'should add all standard category guidelines', () => {
			let state = createInitialState();
			state = setGuideline( state, 'site', 'Site guidelines' );
			state = setGuideline( state, 'copy', 'Copy guidelines' );
			state = setGuideline( state, 'images', 'Image guidelines' );
			state = setGuideline(
				state,
				'additional',
				'Additional guidelines'
			);

			const all = selectors.getAllGuidelines( state );
			expect( all ).toMatchObject( {
				site: 'Site guidelines',
				copy: 'Copy guidelines',
				images: 'Image guidelines',
				additional: 'Additional guidelines',
			} );
		} );

		test( 'should add block guideline', () => {
			const state = createInitialState();
			const updated = setBlockGuideline(
				state,
				'core/paragraph',
				'Use short paragraphs'
			);

			expect(
				selectors.getBlockGuideline( updated, 'core/paragraph' )
			).toBe( 'Use short paragraphs' );
		} );

		test( 'should add multiple block guidelines', () => {
			let state = createInitialState();
			state = setBlockGuideline( state, 'core/paragraph', 'Para' );
			state = setBlockGuideline( state, 'core/heading', 'Head' );
			state = setBlockGuideline( state, 'core/image', 'Image' );

			const blocks = selectors.getBlockGuidelines( state );
			expect( blocks ).toMatchObject( {
				'core/paragraph': 'Para',
				'core/heading': 'Head',
				'core/image': 'Image',
			} );
		} );

		test( 'should hydrate from API response', () => {
			const state = createInitialState();
			const response: RestGuidelinesResponse = {
				id: 1,
				status: 'draft',
				guideline_categories: {
					site: { guidelines: 'Site guidelines' },
					copy: { guidelines: 'Copy guidelines' },
					images: { guidelines: 'Image guidelines' },
					additional: { guidelines: 'Additional guidelines' },
					blocks: {
						'core/paragraph': {
							guidelines: 'Paragraph guidelines',
						},
					},
				},
			};

			const updated = setFromResponse( state, response );

			expect( selectors.getId( updated ) ).toBe( 1 );
			expect( selectors.getStatus( updated ) ).toBe( 'draft' );
			expect( selectors.getGuideline( updated, 'site' ) ).toBe(
				'Site guidelines'
			);
			expect(
				selectors.getBlockGuideline( updated, 'core/paragraph' )
			).toBe( 'Paragraph guidelines' );
		} );
	} );

	describe( 'READ', () => {
		test( 'should retrieve single guideline', () => {
			const state = setGuideline(
				createInitialState(),
				'site',
				'Test guidelines'
			);

			expect( selectors.getGuideline( state, 'site' ) ).toBe(
				'Test guidelines'
			);
		} );

		test( 'should retrieve all guidelines', () => {
			let state = createInitialState();
			state = setGuideline( state, 'site', 'Site' );
			state = setGuideline( state, 'copy', 'Copy' );

			const all = selectors.getAllGuidelines( state );
			expect( all.site ).toBe( 'Site' );
			expect( all.copy ).toBe( 'Copy' );
			expect( all.images ).toBe( '' );
		} );

		test( 'should retrieve specific block guideline', () => {
			const state = setBlockGuideline(
				createInitialState(),
				'core/paragraph',
				'Para'
			);

			expect(
				selectors.getBlockGuideline( state, 'core/paragraph' )
			).toBe( 'Para' );
		} );

		test( 'should retrieve all block guidelines', () => {
			let state = createInitialState();
			state = setBlockGuideline( state, 'core/paragraph', 'Para' );
			state = setBlockGuideline( state, 'core/heading', 'Head' );

			const blocks = selectors.getBlockGuidelines( state );
			expect( blocks ).toEqual( {
				'core/paragraph': 'Para',
				'core/heading': 'Head',
			} );
		} );

		test( 'should return empty string for non-existent block', () => {
			const state = createInitialState();

			const guideline = selectors.getBlockGuideline(
				state,
				'core/does-not-exist'
			);
			expect( guideline ).toBe( '' );
		} );

		test( 'should retrieve ID and status', () => {
			const response: RestGuidelinesResponse = {
				id: 42,
				status: 'publish',
				guideline_categories: {
					site: { guidelines: 'Site' },
				},
			};

			const state = setFromResponse( createInitialState(), response );

			expect( selectors.getId( state ) ).toBe( 42 );
			expect( selectors.getStatus( state ) ).toBe( 'publish' );
		} );
	} );

	describe( 'UPDATE', () => {
		test( 'should update existing guideline', () => {
			let state = setGuideline(
				createInitialState(),
				'site',
				'Original'
			);
			expect( selectors.getGuideline( state, 'site' ) ).toBe(
				'Original'
			);

			state = setGuideline( state, 'site', 'Updated' );
			expect( selectors.getGuideline( state, 'site' ) ).toBe( 'Updated' );
		} );

		test( 'should not affect other categories when updating', () => {
			let state = createInitialState();
			state = setGuideline( state, 'site', 'Site' );
			state = setGuideline( state, 'copy', 'Copy' );

			state = setGuideline( state, 'site', 'New site' );

			expect( selectors.getGuideline( state, 'site' ) ).toBe(
				'New site'
			);
			expect( selectors.getGuideline( state, 'copy' ) ).toBe( 'Copy' );
		} );

		test( 'should update block guideline', () => {
			let state = setBlockGuideline(
				createInitialState(),
				'core/paragraph',
				'Original'
			);

			state = setBlockGuideline( state, 'core/paragraph', 'Updated' );

			expect(
				selectors.getBlockGuideline( state, 'core/paragraph' )
			).toBe( 'Updated' );
		} );

		test( 'should not affect other blocks when updating', () => {
			let state = createInitialState();
			state = setBlockGuideline( state, 'core/paragraph', 'Para' );
			state = setBlockGuideline( state, 'core/heading', 'Head' );

			state = setBlockGuideline(
				state,
				'core/paragraph',
				'Updated para'
			);

			expect(
				selectors.getBlockGuideline( state, 'core/paragraph' )
			).toBe( 'Updated para' );
			expect( selectors.getBlockGuideline( state, 'core/heading' ) ).toBe(
				'Head'
			);
		} );

		test( 'should update from new API response', () => {
			let state = createInitialState();

			const firstResponse: RestGuidelinesResponse = {
				id: 1,
				status: 'draft',
				guideline_categories: {
					site: { guidelines: 'Original site guidelines' },
				},
			};

			state = setFromResponse( state, firstResponse );

			const secondResponse: RestGuidelinesResponse = {
				id: 1,
				status: 'publish',
				guideline_categories: {
					site: { guidelines: 'Updated site guidelines' },
				},
			};

			state = setFromResponse( state, secondResponse );

			expect( selectors.getGuideline( state, 'site' ) ).toBe(
				'Updated site guidelines'
			);
			expect( selectors.getStatus( state ) ).toBe( 'publish' );
		} );
	} );

	describe( 'DELETE', () => {
		test( 'should delete a guideline', () => {
			let state = setGuideline( createInitialState(), 'site', 'Content' );
			expect( selectors.getGuideline( state, 'site' ) ).toBe( 'Content' );

			state = reducer( state, actions.setGuideline( 'site', '' ) );
			expect( selectors.getGuideline( state, 'site' ) ).toBe( '' );
		} );

		test( 'should delete without affecting other categories', () => {
			let state = createInitialState();
			state = setGuideline( state, 'site', 'Site' );
			state = setGuideline( state, 'copy', 'Copy' );

			state = reducer( state, actions.setGuideline( 'site', '' ) );

			expect( selectors.getGuideline( state, 'site' ) ).toBe( '' );
			expect( selectors.getGuideline( state, 'copy' ) ).toBe( 'Copy' );
		} );

		test( 'should delete a block guideline', () => {
			let state = setBlockGuideline(
				createInitialState(),
				'core/paragraph',
				'Content'
			);

			state = reducer(
				state,
				actions.setBlockGuideline( 'core/paragraph', '' )
			);

			expect(
				selectors.getBlockGuideline( state, 'core/paragraph' )
			).toBe( '' );
		} );

		test( 'should delete block guideline without affecting other blocks', () => {
			let state = createInitialState();
			state = setBlockGuideline( state, 'core/paragraph', 'Para' );
			state = setBlockGuideline( state, 'core/heading', 'Head' );

			state = reducer(
				state,
				actions.setBlockGuideline( 'core/paragraph', '' )
			);

			expect(
				selectors.getBlockGuideline( state, 'core/paragraph' )
			).toBe( '' );
			expect( selectors.getBlockGuideline( state, 'core/heading' ) ).toBe(
				'Head'
			);
		} );
	} );
} );
