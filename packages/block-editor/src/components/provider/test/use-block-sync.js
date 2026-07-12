/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useBlockSync from '../use-block-sync';
import withRegistryProvider from '../with-registry-provider';
import * as blockEditorActions from '../../../store/actions';
import { SelectionContext } from '../selection-context';

import { store as blockEditorStore } from '../../../store';
jest.mock( '../../../store/actions', () => {
	const actions = jest.requireActual( '../../../store/actions' );
	return {
		...actions,
		resetBlocks: jest.fn( actions.resetBlocks ),
		replaceInnerBlocks: jest.fn( actions.replaceInnerBlocks ),
		setHasControlledInnerBlocks: jest.fn(
			actions.setHasControlledInnerBlocks
		),
	};
} );

const TestWrapper = withRegistryProvider( ( props ) => {
	if ( props.setRegistry ) {
		props.setRegistry( props.registry );
	}
	useBlockSync( props );
	return null;
} );

// Renders one useBlockSync controller. Several of these can be nested
// under a single SelectionTestWrapper to simulate multiple controlled
// blocks (e.g. two Navigation blocks) sharing one block-editor store.
function Controller( props ) {
	useBlockSync( props );
	return null;
}

// Provides a single registry and a SelectionContext (normally provided
// by BlockEditorProvider) so tests can control the entity-level
// selection that restoreSelection() reads.
const SelectionTestWrapper = withRegistryProvider(
	( { registry, setRegistry, getSelection, children } ) => {
		if ( setRegistry ) {
			setRegistry( registry );
		}
		return (
			<SelectionContext.Provider
				value={ { getSelection, onChangeSelection: () => {} } }
			>
				{ children }
			</SelectionContext.Provider>
		);
	}
);

describe( 'useBlockSync hook', () => {
	beforeAll( () => {
		registerBlockType( 'test/test-block', {
			apiVersion: 3,
			title: 'Test block',
			attributes: {
				foo: { type: 'number' },
			},
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'resets the block-editor blocks when the controlled value changes', async () => {
		const fakeBlocks = [];
		const resetBlocks = jest.spyOn( blockEditorActions, 'resetBlocks' );
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);
		const onChange = jest.fn();
		const onInput = jest.fn();

		const { rerender, unmount } = render(
			<TestWrapper
				value={ fakeBlocks }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		// Reset blocks should be called on mount.
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		expect( resetBlocks ).toHaveBeenCalledWith( fakeBlocks );
		expect( resetBlocks ).toHaveBeenCalledTimes( 1 );

		const testBlocks = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		rerender(
			<TestWrapper
				value={ testBlocks }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		// Reset blocks should be called when the incoming value changes.
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		expect( resetBlocks ).toHaveBeenCalledWith( testBlocks );
		expect( resetBlocks ).toHaveBeenCalledTimes( 2 );

		unmount();

		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		expect( resetBlocks ).toHaveBeenCalledWith( [] );
		expect( resetBlocks ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'replaces the inner blocks of a block when the controlled value changes if a clientId is passed', async () => {
		const fakeBlocks = [];
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);
		const resetBlocks = jest.spyOn( blockEditorActions, 'resetBlocks' );
		const onChange = jest.fn();
		const onInput = jest.fn();

		const { rerender, unmount } = render(
			<TestWrapper
				clientId="test"
				value={ fakeBlocks }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		expect( resetBlocks ).not.toHaveBeenCalled();
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).toHaveBeenCalledWith(
			'test', // It should use the given client ID.
			fakeBlocks // It should use the controlled blocks value.
		);
		expect( replaceInnerBlocks ).toHaveBeenCalledTimes( 1 );

		const testBlocks = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];
		rerender(
			<TestWrapper
				clientId="test"
				value={ testBlocks }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		// Reset blocks should be called when the incoming value changes.
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( resetBlocks ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'test', [
			expect.objectContaining( { name: 'test/test-block' } ),
		] );
		expect( replaceInnerBlocks ).toHaveBeenCalledTimes( 2 );

		unmount();

		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( resetBlocks ).not.toHaveBeenCalled();
		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'test', [] );
		expect( replaceInnerBlocks ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'does not add the controlled blocks to the block-editor store if the store already contains them', async () => {
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);
		const onChange = jest.fn();
		const onInput = jest.fn();

		const value1 = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};
		const { rerender } = render(
			<TestWrapper
				setRegistry={ setRegistry }
				clientId="test"
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		const newBlockValue = registry
			.select( blockEditorStore )
			.getBlocks( 'test' );
		replaceInnerBlocks.mockClear();

		// Assert that the reference has changed so that the side effect will be
		// triggered once more.
		expect( newBlockValue ).not.toBe( value1 );

		rerender(
			<TestWrapper
				clientId="test"
				value={ newBlockValue }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		// replaceInnerBlocks should not be called when the controlling
		// block value is the same as what already exists in the store.
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
	} );

	it( 'sets a block as an inner block controller if a clientId is provided', async () => {
		const setAsController = jest.spyOn(
			blockEditorActions,
			'setHasControlledInnerBlocks'
		);

		render(
			<TestWrapper
				clientId="test"
				value={ [] }
				onChange={ jest.fn() }
				onInput={ jest.fn() }
			/>
		);
		expect( setAsController ).toHaveBeenCalledWith( 'test', true );
	} );

	it( 'calls onInput when a non-persistent block change occurs', async () => {
		const onChange = jest.fn();
		const onInput = jest.fn();
		const value1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};
		render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);
		onChange.mockClear();
		onInput.mockClear();

		// Create a non-persistent change.
		registry
			.dispatch( blockEditorStore )
			.__unstableMarkNextChangeAsNotPersistent();
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		expect( onInput ).toHaveBeenCalledWith(
			[ { clientId: 'a', innerBlocks: [], attributes: { foo: 2 } } ],
			expect.objectContaining( { selection: expect.any( Object ) } )
		);
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'passes undoIgnore when a non-persistent block change ignores history', async () => {
		const onChange = jest.fn();
		const onInput = jest.fn();
		const value1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};
		render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);
		onChange.mockClear();
		onInput.mockClear();

		registry
			.dispatch( blockEditorStore )
			.__unstableMarkNextChangeAsNotPersistent( {
				history: 'ignore',
			} );
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		expect( onInput ).toHaveBeenCalledWith(
			[ { clientId: 'a', innerBlocks: [], attributes: { foo: 2 } } ],
			expect.objectContaining( {
				selection: expect.any( Object ),
				undoIgnore: true,
			} )
		);
		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'calls onChange if a persistent change occurs', async () => {
		const onChange = jest.fn();
		const onInput = jest.fn();

		const value1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};
		render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);
		onChange.mockClear();
		onInput.mockClear();

		// Create a persistent change.
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		expect( onChange ).toHaveBeenCalledWith(
			[ { clientId: 'a', innerBlocks: [], attributes: { foo: 2 } } ],
			expect.objectContaining( { selection: expect.any( Object ) } )
		);
		expect( onInput ).not.toHaveBeenCalled();
	} );

	it( 'avoids updating the parent if there is a pending incoming change', async () => {
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);

		const onChange = jest.fn();
		const onInput = jest.fn();

		const value1 = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		const { rerender } = render(
			<TestWrapper
				clientId="test"
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);
		onChange.mockClear();
		onInput.mockClear();
		replaceInnerBlocks.mockClear();

		rerender(
			<TestWrapper
				clientId="test"
				value={ [] }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		expect( replaceInnerBlocks ).toHaveBeenCalledWith( 'test', [] );
		expect( replaceInnerBlocks ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
	} );

	it( 'avoids updating the block-editor store if there is a pending outgoint change', async () => {
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);

		const onChange = jest.fn();
		const onInput = jest.fn();

		const value1 = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};
		render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ value1 }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);
		onChange.mockClear();
		onInput.mockClear();
		replaceInnerBlocks.mockClear();

		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		expect( replaceInnerBlocks ).not.toHaveBeenCalled();
		expect( onChange ).toHaveBeenCalledWith(
			[
				{
					name: 'test/test-block',
					clientId: 'a',
					innerBlocks: [],
					attributes: { foo: 2 },
				},
			],
			expect.objectContaining( { selection: expect.any( Object ) } )
		);
		expect( onInput ).not.toHaveBeenCalled();
	} );

	it( 'should use fresh callbacks if onChange/onInput have been updated when previous changes have been made', async () => {
		const fakeBlocks = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		const onChange1 = jest.fn();
		const onInput = jest.fn();

		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};

		const { rerender } = render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ fakeBlocks }
				onChange={ onChange1 }
				onInput={ onInput }
			/>
		);

		// Create a persistent change.
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'a', { foo: 2 } );

		const updatedBlocks1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 2 } },
		];

		expect( onChange1 ).toHaveBeenCalledWith(
			updatedBlocks1,
			expect.objectContaining( { selection: expect.any( Object ) } )
		);

		const newBlocks = [
			{ clientId: 'b', innerBlocks: [], attributes: { foo: 1 } },
		];

		// Reset it so that we can test that it was not called after this point.
		onChange1.mockReset();
		const onChange2 = jest.fn();

		// Update the component to point at a "different entity" (e.g. different
		// blocks and onChange handler.)
		rerender(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ newBlocks }
				onChange={ onChange2 }
				onInput={ onInput }
			/>
		);

		// Create a persistent change.
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'b', { foo: 3 } );

		// The first callback should not have been called.
		expect( onChange1 ).not.toHaveBeenCalled();

		// The second callback should be called with the new change.
		expect( onChange2 ).toHaveBeenCalledWith(
			[ { clientId: 'b', innerBlocks: [], attributes: { foo: 3 } } ],
			expect.objectContaining( { selection: expect.any( Object ) } )
		);
	} );

	it( 'should use fresh callbacks if onChange/onInput have been updated when no previous changes have been made', async () => {
		const fakeBlocks = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		const onChange1 = jest.fn();
		const onInput = jest.fn();

		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};

		const { rerender } = render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ fakeBlocks }
				onChange={ onChange1 }
				onInput={ onInput }
			/>
		);

		const newBlocks = [
			{ clientId: 'b', innerBlocks: [], attributes: { foo: 1 } },
		];

		const onChange2 = jest.fn();

		// Update the component to point at a "different entity" (e.g. different
		// blocks and onChange handler.)
		rerender(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ newBlocks }
				onChange={ onChange2 }
				onInput={ onInput }
			/>
		);

		// Create a persistent change.
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( 'b', { foo: 3 } );

		// The first callback should never be called in this scenario.
		expect( onChange1 ).not.toHaveBeenCalled();

		// Only the new callback should be called.
		expect( onChange2 ).toHaveBeenCalledWith(
			[ { clientId: 'b', innerBlocks: [], attributes: { foo: 3 } } ],
			expect.objectContaining( { selection: expect.any( Object ) } )
		);
	} );

	it( 'preserves external client IDs in onChange callback for inner block controllers', async () => {
		const originalClientId = 'original-external-id';
		const innerBlockClientId = 'inner-external-id';
		const onChange = jest.fn();
		const onInput = jest.fn();
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);

		// Blocks with specific external client IDs
		const controlledBlocks = [
			{
				name: 'test/test-block',
				clientId: originalClientId,
				innerBlocks: [
					{
						name: 'test/test-block',
						clientId: innerBlockClientId,
						innerBlocks: [],
						attributes: { foo: 10 },
					},
				],
				attributes: { foo: 1 },
			},
		];

		let registry;
		const setRegistry = ( reg ) => {
			registry = reg;
		};

		render(
			<TestWrapper
				setRegistry={ setRegistry }
				value={ controlledBlocks }
				onChange={ onChange }
				onInput={ onInput }
			/>
		);

		// For the root case (no clientId), blocks are not cloned
		// So the external IDs should be preserved as-is
		expect( replaceInnerBlocks ).not.toHaveBeenCalled();

		onChange.mockClear();
		onInput.mockClear();

		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( originalClientId, { foo: 2 } );

		// The onChange callback should receive blocks with the same external IDs
		expect( onChange ).toHaveBeenCalledWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					clientId: originalClientId,
					attributes: { foo: 2 },
					innerBlocks: expect.arrayContaining( [
						expect.objectContaining( {
							clientId: innerBlockClientId,
						} ),
					] ),
				} ),
			] ),
			expect.objectContaining( { selection: expect.any( Object ) } )
		);
	} );

	it( 'clones blocks with new internal IDs for inner block controllers', async () => {
		const originalClientId = 'original-external-id';
		const replaceInnerBlocks = jest.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);

		// Blocks with specific external client IDs
		const controlledBlocks = [
			{
				name: 'test/test-block',
				clientId: originalClientId,
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		render(
			<TestWrapper
				clientId="test-controller"
				value={ controlledBlocks }
				onChange={ jest.fn() }
				onInput={ jest.fn() }
			/>
		);

		// replaceInnerBlocks should have been called with cloned blocks
		expect( replaceInnerBlocks ).toHaveBeenCalled();
		const replacedBlocks = replaceInnerBlocks.mock.calls[ 0 ][ 1 ];

		// The internal IDs should be different from the external IDs (due to cloning)
		expect( replacedBlocks[ 0 ].clientId ).not.toBe( originalClientId );
	} );

	describe( 'selection restoration', () => {
		// The entity blocks shared by the duplicate controllers below,
		// like a wp_navigation menu used by two Navigation blocks.
		const sharedEntityBlocks = [
			{
				name: 'test/test-block',
				clientId: 'link-1',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		it( 'restores the entity selection onto its own clones when an inner block controller syncs', () => {
			let registry;
			const setRegistry = ( reg ) => {
				registry = reg;
			};
			const selection = {
				selectionStart: { clientId: 'link-1' },
				selectionEnd: { clientId: 'link-1' },
			};

			render(
				<SelectionTestWrapper
					setRegistry={ setRegistry }
					getSelection={ () => selection }
				>
					<Controller
						clientId="nav-a"
						value={ sharedEntityBlocks }
						onChange={ jest.fn() }
						onInput={ jest.fn() }
					/>
				</SelectionTestWrapper>
			);

			// The selection uses the external ID ('link-1'), and must be
			// restored onto the controller's internal clone of it.
			const clone = registry
				.select( blockEditorStore )
				.getBlocks( 'nav-a' )[ 0 ];
			expect(
				registry.select( blockEditorStore ).getSelectionStart().clientId
			).toBe( clone.clientId );
		} );

		it( 'does not let a duplicate controller steal the selection when a shared entity updates', () => {
			let registry;
			const setRegistry = ( reg ) => {
				registry = reg;
			};
			// Holds the entity-level selection, unset until the user selects.
			const contextSelection = { current: undefined };
			const getSelection = () => contextSelection.current;
			const renderControllers = ( value ) => (
				<SelectionTestWrapper
					setRegistry={ setRegistry }
					getSelection={ getSelection }
				>
					<Controller
						clientId="nav-a"
						value={ value }
						onChange={ jest.fn() }
						onInput={ jest.fn() }
					/>
					<Controller
						clientId="nav-b"
						value={ value }
						onChange={ jest.fn() }
						onInput={ jest.fn() }
					/>
				</SelectionTestWrapper>
			);

			const { rerender } = render(
				renderControllers( sharedEntityBlocks )
			);

			// The user selects the block inside the first controller.
			const cloneA = registry
				.select( blockEditorStore )
				.getBlocks( 'nav-a' )[ 0 ];
			registry
				.dispatch( blockEditorStore )
				.selectBlock( cloneA.clientId );

			// The selection is recorded on the entity with external IDs,
			// which both controllers can map — neither map identifies the
			// owner, so this is where the ownership ambiguity comes from.
			contextSelection.current = {
				selectionStart: { clientId: 'link-1' },
				selectionEnd: { clientId: 'link-1' },
			};

			// The shared entity updates, so both controllers re-clone
			// their blocks and try to restore the selection.
			rerender(
				renderControllers( [
					{ ...sharedEntityBlocks[ 0 ], attributes: { foo: 2 } },
				] )
			);

			const { getSelectionStart, getBlockParents } =
				registry.select( blockEditorStore );
			const selectedClientId = getSelectionStart().clientId;
			expect( selectedClientId ).toBeTruthy();
			// The selection must stay within the controller that owned it,
			// not move to the duplicate that synced last.
			expect( getBlockParents( selectedClientId ) ).toContain( 'nav-a' );
			expect( getBlockParents( selectedClientId ) ).not.toContain(
				'nav-b'
			);
		} );

		it( 'restores the entity selection into a controller even while another block is selected (undo jump-in)', () => {
			let registry;
			const setRegistry = ( reg ) => {
				registry = reg;
			};
			// Holds the entity-level selection, unset until the user selects.
			const contextSelection = { current: undefined };
			const getSelection = () => contextSelection.current;
			const otherEntityBlocks = [
				{
					name: 'test/test-block',
					clientId: 'other-1',
					innerBlocks: [],
					attributes: { foo: 1 },
				},
			];
			const renderControllers = ( value ) => (
				<SelectionTestWrapper
					setRegistry={ setRegistry }
					getSelection={ getSelection }
				>
					<Controller
						clientId="nav-a"
						value={ sharedEntityBlocks }
						onChange={ jest.fn() }
						onInput={ jest.fn() }
					/>
					<Controller
						clientId="other"
						value={ value }
						onChange={ jest.fn() }
						onInput={ jest.fn() }
					/>
				</SelectionTestWrapper>
			);

			const { rerender } = render(
				renderControllers( otherEntityBlocks )
			);

			// The user is working inside the first controller…
			const cloneA = registry
				.select( blockEditorStore )
				.getBlocks( 'nav-a' )[ 0 ];
			registry
				.dispatch( blockEditorStore )
				.selectBlock( cloneA.clientId );

			// …when the other controller's entity comes back with a
			// selection targeting its own content (e.g. undoing an edit
			// made inside it). The selection targets a different external
			// block than the one currently selected, so it must be applied.
			contextSelection.current = {
				selectionStart: { clientId: 'other-1' },
				selectionEnd: { clientId: 'other-1' },
			};
			rerender(
				renderControllers( [
					{ ...otherEntityBlocks[ 0 ], attributes: { foo: 2 } },
				] )
			);

			const { getSelectionStart, getBlockParents } =
				registry.select( blockEditorStore );
			const selectedClientId = getSelectionStart().clientId;
			expect( getBlockParents( selectedClientId ) ).toContain( 'other' );
		} );

		it( 'restores the entity selection when the root controller resets blocks (undo/redo)', () => {
			let registry;
			const setRegistry = ( reg ) => {
				registry = reg;
			};
			// Holds the entity-level selection, unset until the user selects.
			const contextSelection = { current: undefined };
			const getSelection = () => contextSelection.current;
			const renderRoot = ( value ) => (
				<SelectionTestWrapper
					setRegistry={ setRegistry }
					getSelection={ getSelection }
				>
					<Controller
						value={ value }
						onChange={ jest.fn() }
						onInput={ jest.fn() }
					/>
				</SelectionTestWrapper>
			);

			const { rerender } = render(
				renderRoot( [
					{
						name: 'test/test-block',
						clientId: 'a',
						innerBlocks: [],
						attributes: { foo: 1 },
					},
				] )
			);

			// The user places the caret in the block ("typing").
			registry
				.dispatch( blockEditorStore )
				.selectionChange( 'a', 'foo', 5, 5 );

			// Undo: the entity restores an earlier value AND an earlier
			// selection (different offset). Because block 'a' still exists
			// after the reset, the store keeps the stale caret — the
			// entity selection must still win, or undo would leave the
			// caret where it was after typing.
			contextSelection.current = {
				selectionStart: {
					clientId: 'a',
					attributeKey: 'foo',
					offset: 2,
				},
				selectionEnd: {
					clientId: 'a',
					attributeKey: 'foo',
					offset: 2,
				},
			};
			rerender(
				renderRoot( [
					{
						name: 'test/test-block',
						clientId: 'a',
						innerBlocks: [],
						attributes: { foo: 0 },
					},
				] )
			);

			expect(
				registry.select( blockEditorStore ).getSelectionStart()
			).toEqual( { clientId: 'a', attributeKey: 'foo', offset: 2 } );
		} );
	} );
} );
