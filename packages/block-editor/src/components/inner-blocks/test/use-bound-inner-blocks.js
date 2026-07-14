/**
 * External dependencies
 */
import { act, render, renderHook, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { RawHTML } from '@wordpress/element';
import {
	__unstableGetInnerBlocksProps as getInnerBlocksProps,
	createBlock,
	getBlockTypes,
	registerBlockBindingsSource,
	registerBlockType,
	unregisterBlockBindingsSource,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { useBoundInnerBlocksProps } from '../use-bound-inner-blocks';
import { BlockContextProvider } from '../../block-context';
import useBlockSync from '../../provider/use-block-sync';

const SOURCE_NAME = 'test/inner-blocks';
const PARAGRAPH_MARKUP =
	'<!-- wp:paragraph --><p>Bound paragraph</p><!-- /wp:paragraph -->';

function SyncedInnerBlocks( props ) {
	useBlockSync( props );
	return null;
}

function BoundInnerBlocksController( {
	clientId,
	binding,
	isPatternOverrideInstance = false,
} ) {
	const props = useBoundInnerBlocksProps(
		clientId,
		binding,
		undefined,
		isPatternOverrideInstance
	);
	return props ? (
		<SyncedInnerBlocks clientId={ clientId } { ...props } />
	) : null;
}

describe( 'useBoundInnerBlocksProps', () => {
	let mountedHooks;

	beforeEach( () => {
		mountedHooks = [];
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			category: 'text',
			title: 'Paragraph',
			attributes: {
				content: { type: 'string', source: 'html', selector: 'p' },
			},
			save: ( { attributes } ) => (
				<p>
					<RawHTML>{ attributes.content }</RawHTML>
				</p>
			),
		} );
		registerBlockType( 'test/inner-host', {
			apiVersion: 3,
			category: 'text',
			title: 'Inner host',
			usesContext: [ 'test/host-context' ],
			save: () => {
				const { children } = getInnerBlocksProps();
				return <div>{ children }</div>;
			},
		} );
	} );

	afterEach( async () => {
		await act( async () => {
			mountedHooks.forEach( ( { unmount } ) => unmount() );
			dispatch( blockEditorStore ).resetBlocks( [] );
		} );
		unregisterBlockBindingsSource( SOURCE_NAME );
		getBlockTypes().forEach( ( blockType ) => {
			unregisterBlockType( blockType.name );
		} );
	} );

	function setupHost( binding ) {
		const block = createBlock(
			'test/inner-host',
			{ metadata: { bindings: { innerBlocks: binding } } },
			[
				createBlock( 'core/paragraph', {
					content: 'Fallback paragraph',
				} ),
			]
		);
		act( () => {
			dispatch( blockEditorStore ).resetBlocks( [ block ] );
		} );
		return block.clientId;
	}

	function renderBoundHook( clientId, binding, wrapper ) {
		const view = renderHook(
			() => useBoundInnerBlocksProps( clientId, binding ),
			{ wrapper }
		);
		mountedHooks.push( view );
		return view;
	}

	function renderBoundController(
		clientId,
		binding,
		isPatternOverrideInstance = false
	) {
		const view = render(
			<BoundInnerBlocksController
				clientId={ clientId }
				binding={ binding }
				isPatternOverrideInstance={ isPatternOverrideInstance }
			/>
		);
		mountedHooks.push( view );
		return view;
	}

	it( 'parses a serialized value from a registered source', () => {
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: () => {},
		} );
		const binding = { source: SOURCE_NAME, args: { key: 'hero' } };
		const clientId = setupHost( binding );

		const { result } = renderBoundHook( clientId, binding );

		expect( result.current.value ).toHaveLength( 1 );
		expect( result.current.value[ 0 ].name ).toBe( 'core/paragraph' );
		expect( result.current.value[ 0 ].attributes.content ).toBe(
			'Bound paragraph'
		);
	} );

	it( 'treats an empty string as an intentionally empty controlled area', () => {
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: '' } ),
			setValues: () => {},
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );

		const { result } = renderBoundHook( clientId, binding );

		expect( result.current.value ).toEqual( [] );
	} );

	it( 'returns undefined when the source value is absent', () => {
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: undefined } ),
			setValues: () => {},
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );

		const { result } = renderBoundHook( clientId, binding );

		expect( result.current ).toBeUndefined();
	} );

	it( 'creates the first pattern override from fallback children', async () => {
		const setValues = jest.fn();
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: undefined } ),
			setValues,
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );
		renderBoundController( clientId, binding, true );

		await waitFor( () =>
			expect(
				select( blockEditorStore ).areInnerBlocksControlled( clientId )
			).toBe( true )
		);
		const [ child ] = select( blockEditorStore ).getBlocks( clientId );
		expect( child.attributes.content ).toBe( 'Fallback paragraph' );

		act( () => {
			dispatch( blockEditorStore ).updateBlockAttributes(
				child.clientId,
				{
					content: 'First override',
				}
			);
		} );

		await waitFor( () => expect( setValues ).toHaveBeenCalled() );
		expect(
			setValues.mock.calls.at( -1 )[ 0 ].bindings.innerBlocks.newValue
		).toContain( 'First override' );
	} );

	it( 'resets an existing pattern override to fallback without releasing control', async () => {
		let sourceValue = PARAGRAPH_MARKUP;
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: sourceValue } ),
			setValues: () => {},
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );
		const view = renderBoundController( clientId, binding, true );

		await waitFor( () =>
			expect(
				select( blockEditorStore ).getBlocks( clientId )[ 0 ]
					?.attributes.content
			).toBe( 'Bound paragraph' )
		);

		sourceValue = undefined;
		view.rerender(
			<BoundInnerBlocksController
				clientId={ clientId }
				binding={ { ...binding, args: { revision: 1 } } }
				isPatternOverrideInstance
			/>
		);

		await waitFor( () =>
			expect(
				select( blockEditorStore ).getBlocks( clientId )[ 0 ]
					?.attributes.content
			).toBe( 'Fallback paragraph' )
		);
		expect(
			select( blockEditorStore ).areInnerBlocksControlled( clientId )
		).toBe( true );
	} );

	it.each( [ null, 1, [], {} ] )(
		'treats a non-string source value as absent: %p',
		( sourceValue ) => {
			registerBlockBindingsSource( {
				name: SOURCE_NAME,
				label: 'Test source',
				getValues: () => ( { innerBlocks: sourceValue } ),
				setValues: () => {},
			} );
			const binding = { source: SOURCE_NAME };
			const clientId = setupHost( binding );

			const { result } = renderBoundHook( clientId, binding );

			expect( result.current ).toBeUndefined();
		}
	);

	it( 'normalizes malformed source arguments to absence', () => {
		const getValues = jest.fn( () => ( {
			innerBlocks: PARAGRAPH_MARKUP,
		} ) );
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues,
			setValues: () => {},
		} );
		const binding = { source: SOURCE_NAME, args: 'not-an-object' };
		const clientId = setupHost( binding );

		renderBoundHook( clientId, binding );

		expect( getValues ).toHaveBeenCalledWith(
			expect.objectContaining( {
				bindings: { innerBlocks: { args: undefined } },
			} )
		);
	} );

	it( 'fails closed for a nonempty source without fallback children', () => {
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: () => {},
		} );
		const binding = { source: SOURCE_NAME };
		const block = createBlock( 'test/inner-host', {
			metadata: { bindings: { innerBlocks: binding } },
		} );
		act( () => {
			dispatch( blockEditorStore ).resetBlocks( [ block ] );
		} );

		const { result } = renderBoundHook( block.clientId, binding );

		expect( result.current ).toBeUndefined();
	} );

	it( 'writes serialized edits back to the source', () => {
		const setValues = jest.fn();
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues,
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );
		const { result } = renderBoundHook( clientId, binding );
		act( () => {
			dispatch( blockEditorStore ).setHasControlledInnerBlocks(
				clientId,
				true
			);
		} );
		const editedBlocks = [
			createBlock( 'core/paragraph', { content: 'Edited paragraph' } ),
		];

		act( () => {
			result.current.onChange( editedBlocks );
		} );

		expect( setValues ).toHaveBeenCalledWith(
			expect.objectContaining( {
				clientId,
				bindings: {
					innerBlocks: expect.objectContaining( {
						newValue: expect.stringContaining( 'Edited paragraph' ),
					} ),
				},
			} )
		);
	} );

	it( 'drops writes after the host no longer owns controlled inner blocks', () => {
		const setValues = jest.fn();
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues,
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );
		const { result } = renderBoundHook( clientId, binding );

		act( () => {
			result.current.onChange( [
				createBlock( 'core/paragraph', { content: 'Stale edit' } ),
			] );
		} );

		expect( setValues ).not.toHaveBeenCalled();
	} );

	it( 'marks block-editor source writes as non-persistent only for input', () => {
		const markNextChange = jest.spyOn(
			dispatch( blockEditorStore ),
			'__unstableMarkNextChangeAsNotPersistent'
		);
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: ( { dispatch: sourceDispatch } ) => {
				sourceDispatch( blockEditorStore );
			},
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );
		const { result } = renderBoundHook( clientId, binding );
		act( () => {
			dispatch( blockEditorStore ).setHasControlledInnerBlocks(
				clientId,
				true
			);
		} );
		const editedBlocks = [
			createBlock( 'core/paragraph', { content: 'Edited paragraph' } ),
		];

		act( () => {
			result.current.onInput( editedBlocks );
		} );
		expect( markNextChange ).toHaveBeenCalledTimes( 1 );

		markNextChange.mockClear();
		act( () => {
			result.current.onChange( editedBlocks );
		} );
		expect( markNextChange ).not.toHaveBeenCalled();
		markNextChange.mockRestore();
	} );

	it( 'keeps the same edited block mounted when the source echoes typing', async () => {
		let sourceValue = PARAGRAPH_MARKUP;
		const setValues = jest.fn( ( { bindings } ) => {
			sourceValue = bindings.innerBlocks.newValue;
		} );
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: sourceValue } ),
			setValues,
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );
		const view = renderBoundController( clientId, binding );
		await waitFor( () =>
			expect(
				select( blockEditorStore ).getBlocks( clientId )[ 0 ]
					?.attributes.content
			).toBe( 'Bound paragraph' )
		);
		const initialChild =
			select( blockEditorStore ).getBlocks( clientId )[ 0 ];

		act( () => {
			dispatch(
				blockEditorStore
			).__unstableMarkNextChangeAsNotPersistent();
			dispatch( blockEditorStore ).updateBlockAttributes(
				initialChild.clientId,
				{ content: 'Typed paragraph' }
			);
		} );
		view.rerender(
			<BoundInnerBlocksController
				clientId={ clientId }
				binding={ { ...binding, args: { revision: 1 } } }
			/>
		);
		await waitFor( () =>
			expect(
				select( blockEditorStore ).getBlocks( clientId )[ 0 ]
					?.attributes.content
			).toBe( 'Typed paragraph' )
		);

		const echoedChild =
			select( blockEditorStore ).getBlocks( clientId )[ 0 ];
		expect( setValues ).toHaveBeenCalled();
		expect( sourceValue ).toContain( 'Typed paragraph' );
		expect( echoedChild.clientId ).toBe( initialChild.clientId );
		expect( echoedChild.attributes.content ).toBe( 'Typed paragraph' );
	} );

	it( 'keeps the current children when control is released', async () => {
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			getValues: () => ( { innerBlocks: PARAGRAPH_MARKUP } ),
			setValues: () => {},
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );
		const view = renderBoundController( clientId, binding );
		await waitFor( () =>
			expect(
				select( blockEditorStore ).getBlocks( clientId )[ 0 ]
					?.attributes.content
			).toBe( 'Bound paragraph' )
		);

		expect(
			select( blockEditorStore ).getBlocks( clientId )[ 0 ].attributes
				.content
		).toBe( 'Bound paragraph' );

		view.rerender(
			<BoundInnerBlocksController
				clientId={ clientId }
				binding={ undefined }
			/>
		);
		await waitFor( () =>
			expect(
				select( blockEditorStore ).areInnerBlocksControlled( clientId )
			).toBe( false )
		);

		const restoredBlocks = select( blockEditorStore ).getBlocks( clientId );
		expect(
			select( blockEditorStore ).areInnerBlocksControlled( clientId )
		).toBe( false );
		expect( restoredBlocks ).toHaveLength( 1 );
		expect( restoredBlocks[ 0 ].attributes.content ).toBe(
			'Bound paragraph'
		);
	} );

	it( 'passes host and source context to the source', () => {
		const getValues = jest.fn( () => ( {
			innerBlocks: PARAGRAPH_MARKUP,
		} ) );
		registerBlockBindingsSource( {
			name: SOURCE_NAME,
			label: 'Test source',
			usesContext: [ 'test/source-context' ],
			getValues,
			setValues: () => {},
		} );
		const binding = { source: SOURCE_NAME };
		const clientId = setupHost( binding );
		const wrapper = ( { children } ) => (
			<BlockContextProvider
				value={ {
					'test/host-context': 'host value',
					'test/source-context': 'source value',
				} }
			>
				{ children }
			</BlockContextProvider>
		);

		renderBoundHook( clientId, binding, wrapper );

		expect( getValues ).toHaveBeenCalledWith(
			expect.objectContaining( {
				context: {
					'test/host-context': 'host value',
					'test/source-context': 'source value',
				},
			} )
		);
	} );
} );
