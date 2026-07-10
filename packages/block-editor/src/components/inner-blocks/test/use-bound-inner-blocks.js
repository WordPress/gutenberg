/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
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

const SOURCE_NAME = 'test/inner-blocks';
const PARAGRAPH_MARKUP =
	'<!-- wp:paragraph --><p>Bound paragraph</p><!-- /wp:paragraph -->';

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
		act( () => {
			dispatch( blockEditorStore ).setHasControlledInnerBlocks(
				clientId,
				true
			);
		} );
		const { result } = renderBoundHook( clientId, binding );
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
