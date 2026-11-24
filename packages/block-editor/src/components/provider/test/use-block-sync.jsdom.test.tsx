import { registerBlockType } from '@wordpress/blocks';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { useState } from '@wordpress/element';
import type { ComponentType } from 'react';
import type { Block } from '@wordpress/blocks';
import type { DataRegistry } from '@wordpress/data';
import type {
	BlockEditorProviderProps,
	BlockSelectionState,
	RegistryProvidedProps,
	UseBlockSyncProps,
} from '../types';
import useBlockSync from '../use-block-sync';
import withRegistryProvider from '../with-registry-provider';
import { SelectionContext } from '../selection-context';
import * as blockEditorActions from '../../../store/actions';
import { store as blockEditorStore } from '../../../store';
vi.mock( import( '../../../store/actions' ), async ( importOriginal ) => {
	const actions = await importOriginal();
	return {
		...actions,
		resetBlocks: vi.fn( actions.resetBlocks ),
		replaceInnerBlocks: vi.fn( actions.replaceInnerBlocks ),
		setHasControlledInnerBlocks: vi.fn(
			actions.setHasControlledInnerBlocks
		),
	};
} );

/*
 * The tests pass partial blocks, and a callback receiving the registry the
 * provider creates.
 */
type TestBlock = Partial< Omit< Block, 'innerBlocks' > > & {
	innerBlocks?: TestBlock[];
};

type TestWrapperProps = Omit< BlockEditorProviderProps, 'value' > & {
	value?: TestBlock[];
	setRegistry?: ( registry: DataRegistry ) => void;
};

const TestWrapper = withRegistryProvider(
	(
		props: RegistryProvidedProps & Pick< TestWrapperProps, 'setRegistry' >
	) => {
		if ( props.setRegistry ) {
			props.setRegistry( props.registry );
		}
		useBlockSync( props );
		return null;
	}
) as ComponentType< TestWrapperProps >;

describe( 'useBlockSync hook', () => {
	beforeAll( () => {
		// @ts-expect-error The test block needs no category.
		registerBlockType( 'test/test-block', {
			apiVersion: 3,
			title: 'Test block',
			attributes: {
				foo: { type: 'number' },
			},
		} );
	} );

	afterEach( () => {
		vi.clearAllMocks();
	} );

	it( 'resets the block-editor blocks when the controlled value changes', async () => {
		const fakeBlocks: Block[] = [];
		const resetBlocks = vi.spyOn( blockEditorActions, 'resetBlocks' );
		const replaceInnerBlocks = vi.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);
		const onChange = vi.fn();
		const onInput = vi.fn();

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
		const fakeBlocks: Block[] = [];
		const replaceInnerBlocks = vi.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);
		const resetBlocks = vi.spyOn( blockEditorActions, 'resetBlocks' );
		const onChange = vi.fn();
		const onInput = vi.fn();

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
		const replaceInnerBlocks = vi.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);
		const onChange = vi.fn();
		const onInput = vi.fn();

		const value1 = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		let registry!: DataRegistry;
		const setRegistry = ( reg: DataRegistry ) => {
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
		const setAsController = vi.spyOn(
			blockEditorActions,
			'setHasControlledInnerBlocks'
		);

		render(
			<TestWrapper
				clientId="test"
				value={ [] }
				onChange={ vi.fn() }
				onInput={ vi.fn() }
			/>
		);
		expect( setAsController ).toHaveBeenCalledWith( 'test', true );
	} );

	it( 'calls onInput when a non-persistent block change occurs', async () => {
		const onChange = vi.fn();
		const onInput = vi.fn();
		const value1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		let registry!: DataRegistry;
		const setRegistry = ( reg: DataRegistry ) => {
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
		const onChange = vi.fn();
		const onInput = vi.fn();
		const value1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		let registry!: DataRegistry;
		const setRegistry = ( reg: DataRegistry ) => {
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
		const onChange = vi.fn();
		const onInput = vi.fn();

		const value1 = [
			{ clientId: 'a', innerBlocks: [], attributes: { foo: 1 } },
		];
		let registry!: DataRegistry;
		const setRegistry = ( reg: DataRegistry ) => {
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
		const replaceInnerBlocks = vi.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);

		const onChange = vi.fn();
		const onInput = vi.fn();

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
		const replaceInnerBlocks = vi.spyOn(
			blockEditorActions,
			'replaceInnerBlocks'
		);

		const onChange = vi.fn();
		const onInput = vi.fn();

		const value1 = [
			{
				name: 'test/test-block',
				clientId: 'a',
				innerBlocks: [],
				attributes: { foo: 1 },
			},
		];

		let registry!: DataRegistry;
		const setRegistry = ( reg: DataRegistry ) => {
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
		const onChange1 = vi.fn();
		const onInput = vi.fn();

		let registry!: DataRegistry;
		const setRegistry = ( reg: DataRegistry ) => {
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
		const onChange2 = vi.fn();

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
		const onChange1 = vi.fn();
		const onInput = vi.fn();

		let registry!: DataRegistry;
		const setRegistry = ( reg: DataRegistry ) => {
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

		const onChange2 = vi.fn();

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
		const onChange = vi.fn();
		const onInput = vi.fn();
		const replaceInnerBlocks = vi.spyOn(
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

		let registry!: DataRegistry;
		const setRegistry = ( reg: DataRegistry ) => {
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
		const replaceInnerBlocks = vi.spyOn(
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
				onChange={ vi.fn() }
				onInput={ vi.fn() }
			/>
		);

		// replaceInnerBlocks should have been called with cloned blocks
		expect( replaceInnerBlocks ).toHaveBeenCalled();
		const replacedBlocks = replaceInnerBlocks.mock.calls[ 0 ][ 1 ];

		// The internal IDs should be different from the external IDs (due to cloning)
		expect( replacedBlocks[ 0 ].clientId ).not.toBe( originalClientId );
	} );

	describe( 'controlled value with the same structure', () => {
		const block = (
			attributes: Record< string, unknown >
		): TestBlock => ( {
			name: 'test/test-block',
			clientId: 'external',
			innerBlocks: [
				{
					name: 'test/test-block',
					clientId: 'external-inner',
					innerBlocks: [],
					attributes: { foo: 10 },
				},
			],
			attributes,
		} );

		function renderController() {
			let registry!: DataRegistry;
			const onChange = vi.fn();
			const onInput = vi.fn();
			const view = render(
				<TestWrapper
					clientId="controller"
					setRegistry={ ( reg: DataRegistry ) => {
						if ( ! registry ) {
							registry = reg;
							// The hook ignores changes to the clones of a
							// controller with no block in the store.
							const host: TestBlock = {
								name: 'test/test-block',
								clientId: 'controller',
								innerBlocks: [],
								attributes: {},
							};
							reg.dispatch( blockEditorStore ).resetBlocks( [
								host,
							] as Block[] );
						}
					} }
					value={ [ block( { foo: 1 } ) ] }
					onChange={ onChange }
					onInput={ onInput }
				/>
			);
			const getClones = () =>
				registry.select( blockEditorStore ).getBlocks( 'controller' );
			return { view, getClones, onChange, onInput };
		}

		it( 'updates the existing clones in place instead of re-cloning', () => {
			const replaceInnerBlocks = vi.spyOn(
				blockEditorActions,
				'replaceInnerBlocks'
			);
			const { view, getClones, onChange, onInput } = renderController();
			const [ clone ] = getClones();
			replaceInnerBlocks.mockClear();

			view.rerender(
				<TestWrapper
					clientId="controller"
					value={ [ block( { foo: 2 } ) ] }
					onChange={ onChange }
					onInput={ onInput }
				/>
			);

			expect( replaceInnerBlocks ).not.toHaveBeenCalled();
			const [ updated ] = getClones();
			// Same clone, so nothing holding its client ID is invalidated.
			expect( updated.clientId ).toBe( clone.clientId );
			expect( updated.attributes ).toEqual( { foo: 2 } );
			expect( updated.innerBlocks[ 0 ].clientId ).toBe(
				clone.innerBlocks[ 0 ].clientId
			);
			// The change came from the entity, so it is not reported back.
			expect( onChange ).not.toHaveBeenCalled();
			expect( onInput ).not.toHaveBeenCalled();
		} );

		it( 'still re-clones when the structure changes', () => {
			const replaceInnerBlocks = vi.spyOn(
				blockEditorActions,
				'replaceInnerBlocks'
			);
			const { view, onChange, onInput } = renderController();
			replaceInnerBlocks.mockClear();

			const added = {
				name: 'test/test-block',
				clientId: 'external-added',
				innerBlocks: [],
				attributes: {},
			};
			view.rerender(
				<TestWrapper
					clientId="controller"
					value={ [ block( { foo: 1 } ), added ] }
					onChange={ onChange }
					onInput={ onInput }
				/>
			);

			expect( replaceInnerBlocks ).toHaveBeenCalledTimes( 1 );
		} );

		// Some blocks change more than their attributes. The Custom HTML
		// block keeps its markup in `innerContent`, edited with `updateBlock`.
		it( 'still re-clones when a block field other than attributes changes', () => {
			const replaceInnerBlocks = vi.spyOn(
				blockEditorActions,
				'replaceInnerBlocks'
			);
			const { view, getClones, onChange, onInput } = renderController();
			replaceInnerBlocks.mockClear();

			view.rerender(
				<TestWrapper
					clientId="controller"
					value={ [
						{
							...block( { foo: 1 } ),
							innerContent: [ '<p>new</p>' ],
						},
					] }
					onChange={ onChange }
					onInput={ onInput }
				/>
			);

			expect( replaceInnerBlocks ).toHaveBeenCalledTimes( 1 );
			expect( getClones()[ 0 ].innerContent ).toEqual( [ '<p>new</p>' ] );
		} );
	} );

	describe( 'controllers on one canvas', () => {
		const paragraph = (
			clientId: string,
			content: number
		): TestBlock => ( {
			name: 'test/test-block',
			clientId,
			innerBlocks: [],
			attributes: { foo: content },
		} );

		// Several controllers in one block-editor store, as on a canvas, all
		// reading the recorded selection from the same context.
		type ControllerProps = Omit< UseBlockSyncProps, 'value' > & {
			clientId: string;
			value: TestBlock[];
		};
		type CanvasProps = {
			setRegistry: ( registry: DataRegistry ) => void;
			selectionRef: { current?: BlockSelectionState };
			controllers: ControllerProps[];
		};
		function Controller( props: ControllerProps ) {
			useBlockSync( props as UseBlockSyncProps );
			return null;
		}
		const Canvas = withRegistryProvider(
			( props: RegistryProvidedProps ) => {
				const { registry, setRegistry, selectionRef, controllers } =
					props as RegistryProvidedProps & CanvasProps;
				setRegistry( registry );
				const [ context ] = useState( () => ( {
					getSelection: () => selectionRef.current,
					onChangeSelection: () => {},
				} ) );
				return (
					<SelectionContext.Provider value={ context }>
						{ controllers.map( ( controller ) => (
							<Controller
								key={ controller.clientId }
								{ ...controller }
							/>
						) ) }
					</SelectionContext.Provider>
				);
			}
		) as ComponentType< CanvasProps >;

		function renderCanvas( hostClientIds: string[] ) {
			let registry!: DataRegistry;
			const selectionRef: CanvasProps[ 'selectionRef' ] = {};
			const setRegistry = ( reg: DataRegistry ) => {
				if ( ! registry ) {
					registry = reg;
					reg.dispatch( blockEditorStore ).resetBlocks(
						hostClientIds.map( ( clientId ) =>
							paragraph( clientId, 0 )
						) as Block[]
					);
				}
			};
			const view = render(
				<Canvas
					setRegistry={ setRegistry }
					selectionRef={ selectionRef }
					controllers={ [] }
				/>
			);
			const update = ( controllers: ControllerProps[] ) =>
				view.rerender(
					<Canvas
						setRegistry={ setRegistry }
						selectionRef={ selectionRef }
						controllers={ controllers }
					/>
				);
			const select = () => registry.select( blockEditorStore );
			const selectBlock = ( clientId: string ) =>
				registry.dispatch( blockEditorStore ).selectBlock( clientId );
			return { registry, selectionRef, update, select, selectBlock };
		}

		it( 'does not take the selection from another controller of the same entity', () => {
			const { registry, update, select, selectBlock, selectionRef } =
				renderCanvas( [ 'copy-a', 'copy-b' ] );
			let entity = [ paragraph( 'p', 1 ) ];
			const onChangeA = ( blocks: TestBlock[] ) => ( entity = blocks );
			const onChangeB = vi.fn();
			const controllers = () => [
				{
					clientId: 'copy-a',
					value: entity,
					onChange: onChangeA,
					onInput: onChangeA,
				},
				{
					clientId: 'copy-b',
					value: entity,
					onChange: onChangeB,
					onInput: onChangeB,
				},
			];
			update( controllers() );
			const [ cloneA ] = select().getBlocks( 'copy-a' );
			const [ cloneB ] = select().getBlocks( 'copy-b' );
			selectBlock( cloneA.clientId );
			selectionRef.current = {
				selectionStart: { clientId: 'p' },
				selectionEnd: { clientId: 'p' },
			};

			// Edit copy A, and hand the edited entity to both copies.
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( cloneA.clientId, { foo: 2 } );
			update( controllers() );

			// Copy B mirrors the edit onto the clone it already has.
			const [ mirrored ] = select().getBlocks( 'copy-b' );
			expect( mirrored.clientId ).toBe( cloneB.clientId );
			expect( mirrored.attributes.foo ).toBe( 2 );
			expect( select().getSelectionStart().clientId ).toBe(
				cloneA.clientId
			);
			// Copy B only mirrored the edit, so it reports nothing back.
			expect( onChangeB ).not.toHaveBeenCalled();
		} );

		// Copy B mirrors each keystroke in copy A. History ignores that,
		// or every keystroke would start an undo level of its own.
		it( 'keeps typing in one copy in a single undo level while another copy mirrors it', () => {
			const { registry, update, select } = renderCanvas( [
				'copy-a',
				'copy-b',
			] );
			let entity = [ paragraph( 'p', 0 ) ];
			const reports: string[] = [];
			const controllers = () => [
				{
					clientId: 'copy-a',
					value: entity,
					onChange: ( blocks: TestBlock[] ) => {
						reports.push( 'change' );
						entity = blocks;
					},
					onInput: ( blocks: TestBlock[] ) => {
						reports.push( 'input' );
						entity = blocks;
					},
				},
				{
					clientId: 'copy-b',
					value: entity,
					onChange: vi.fn(),
					onInput: vi.fn(),
				},
			];
			update( controllers() );
			const [ cloneA ] = select().getBlocks( 'copy-a' );

			for ( const foo of [ 1, 2, 3 ] ) {
				registry
					.dispatch( blockEditorStore )
					.updateBlockAttributes( cloneA.clientId, { foo } );
				update( controllers() );
			}

			// The first keystroke opens an undo level and the rest join it.
			expect( reports ).toEqual( [ 'change', 'input', 'input' ] );
			expect( select().getBlocks( 'copy-b' )[ 0 ].attributes.foo ).toBe(
				3
			);
		} );

		// Moving a block in one copy hands the other copy the same blocks
		// in another order. Updating its clones in place would leave each
		// mapped to the block that used to be there, so that an edit to one
		// would be reported as an edit to another.
		it( 're-clones when the blocks are reordered', () => {
			const { registry, update, select } = renderCanvas( [ 'copy' ] );
			const onChange = vi.fn();
			const first = paragraph( 'first', 1 );
			const second = paragraph( 'second', 1 );
			update( [
				{ clientId: 'copy', value: [ first, second ], onChange },
			] );

			update( [
				{ clientId: 'copy', value: [ second, first ], onChange },
			] );
			const [ clone ] = select().getBlocks( 'copy' );
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clone.clientId, { foo: 2 } );

			expect( onChange ).toHaveBeenCalledWith(
				[
					expect.objectContaining( {
						clientId: 'second',
						attributes: { foo: 2 },
					} ),
					expect.objectContaining( {
						clientId: 'first',
						attributes: { foo: 1 },
					} ),
				],
				expect.anything()
			);
		} );

		// An undo in the outer controller, while the caret sits in a
		// controller nested inside it, such as a synced pattern inside Post
		// Content. Re-cloning replaces the nested host, and the block the
		// caret was in with it, so the selection has to be repaired.
		it.each( [
			[ 'updates its clones in place', [], true ],
			[
				're-clones, replacing the nested block',
				[ paragraph( 'added', 0 ) ],
				false,
			],
		] )(
			'restores the selection when the caret is in a nested controller and the outer one %s',
			( _, addedBlocks, keepsClones ) => {
				const { update, select, selectBlock, selectionRef } =
					renderCanvas( [ 'outer' ] );
				const outerBlock = paragraph( 'outer-block', 1 );
				const nestedHost = paragraph( 'nested-host', 0 );
				const outer = {
					clientId: 'outer',
					value: [ outerBlock, nestedHost ],
				};
				update( [ outer ] );
				const [ , nestedHostClone ] = select().getBlocks( 'outer' );
				const nested = {
					clientId: nestedHostClone.clientId,
					value: [ paragraph( 'nested-block', 1 ) ],
				};
				update( [ outer, nested ] );
				const [ outerBlockCloneBefore ] = select().getBlocks( 'outer' );
				selectBlock(
					select().getBlocks( nestedHostClone.clientId )[ 0 ].clientId
				);

				// The undo reverts the outer block and records the
				// selection in it.
				selectionRef.current = {
					selectionStart: { clientId: 'outer-block' },
					selectionEnd: { clientId: 'outer-block' },
				};
				update( [
					{
						...outer,
						value: [
							paragraph( 'outer-block', 0 ),
							nestedHost,
							...addedBlocks,
						],
					},
					nested,
				] );

				const [ outerBlockClone ] = select().getBlocks( 'outer' );
				expect( outerBlockClone.attributes.foo ).toBe( 0 );
				expect(
					outerBlockClone.clientId === outerBlockCloneBefore.clientId
				).toBe( keepsClones );
				expect( select().getSelectionStart().clientId ).toBe(
					outerBlockClone.clientId
				);
			}
		);

		// Post Content inside a Template Part, with the caret on Post Title
		// next to it in the same Template Part. Only another block of the
		// same type renders the same entity.
		it( 'restores the selection when the caret is in a controller of another type', () => {
			const { update, select, selectBlock, selectionRef } = renderCanvas(
				[ 'part' ]
			);
			const contentHost = {
				...paragraph( 'content-host', 0 ),
				name: 'test/other-block',
			};
			const part = {
				clientId: 'part',
				value: [ paragraph( 'title', 0 ), contentHost ],
			};
			update( [ part ] );
			const [ titleClone, contentHostClone ] =
				select().getBlocks( 'part' );
			const content = {
				clientId: contentHostClone.clientId,
				value: [ paragraph( 'content-block', 1 ) ],
			};
			update( [ part, content ] );
			selectBlock( titleClone.clientId );

			// The undo reverts the content block and records the selection
			// in it.
			selectionRef.current = {
				selectionStart: { clientId: 'content-block' },
				selectionEnd: { clientId: 'content-block' },
			};
			update( [
				part,
				{ ...content, value: [ paragraph( 'content-block', 0 ) ] },
			] );

			const [ contentBlockClone ] = select().getBlocks(
				contentHostClone.clientId
			);
			expect( contentBlockClone.attributes.foo ).toBe( 0 );
			expect( select().getSelectionStart().clientId ).toBe(
				contentBlockClone.clientId
			);
		} );

		// The undo level that typing opens starts from the selection the
		// last undo restored, so undoing it hands back that same selection
		// object.
		it( 'restores a selection again when an undo returns to it', () => {
			const { registry, update, select, selectionRef } = renderCanvas( [
				'outer',
			] );
			let entity = [ paragraph( 'p', 1 ) ];
			const onChange = ( blocks: TestBlock[] ) => ( entity = blocks );
			const controllers = () => [
				{
					clientId: 'outer',
					value: entity,
					onChange,
					onInput: onChange,
				},
			];
			update( controllers() );
			const clone = () => select().getBlocks( 'outer' )[ 0 ];
			const caret = ( clientId: string, offset: number ) => ( {
				clientId,
				attributeKey: 'foo',
				offset,
			} );

			// The first undo.
			const restored = {
				selectionStart: caret( 'p', 5 ),
				selectionEnd: caret( 'p', 5 ),
			};
			selectionRef.current = restored;
			entity = [ paragraph( 'p', 2 ) ];
			update( controllers() );
			expect( select().getSelectionStart() ).toEqual(
				caret( clone().clientId, 5 )
			);

			// Typing moves the caret on.
			registry
				.dispatch( blockEditorStore )
				.selectionChange( clone().clientId, 'foo', 8, 8 );
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clone().clientId, { foo: 3 } );
			selectionRef.current = {
				selectionStart: caret( 'p', 8 ),
				selectionEnd: caret( 'p', 8 ),
			};
			update( controllers() );

			// The second undo.
			selectionRef.current = restored;
			entity = [ paragraph( 'p', 2 ) ];
			update( controllers() );
			expect( clone().attributes.foo ).toBe( 2 );
			expect( select().getSelectionStart() ).toEqual(
				caret( clone().clientId, 5 )
			);
		} );
	} );
} );
