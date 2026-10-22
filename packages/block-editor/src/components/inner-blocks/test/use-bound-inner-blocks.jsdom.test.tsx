import type { ReactNode } from 'react';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
	createBlock,
	registerBlockBindingsSource,
	registerBlockType,
	serialize,
	unregisterBlockBindingsSource,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block, BlockConfiguration } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import { BlockContextProvider } from '../../block-context';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import {
	BoundInnerBlocksAncestorsProvider,
	useBoundInnerBlocks,
	useInnerBlocksBinding,
} from '../use-bound-inner-blocks';

const SOURCE = 'test/inner-blocks';
const CONTEXT_SOURCE = 'test/inner-blocks-from-context';

const blockSettings = {
	apiVersion: 3,
	title: 'Test',
	category: 'text',
	attributes: {
		content: { type: 'string' },
		metadata: { type: 'object' },
	},
	save: ( { attributes }: { attributes: { content?: string } } ) =>
		attributes.content ?? null,
} as unknown as BlockConfiguration;

const actions = () => unlock( dispatch( blockEditorStore ) );
const selectors = () => unlock( select( blockEditorStore ) );

// The source keeps its value in an attribute of another block, like pattern
// overrides do.
const getStoredValue = () =>
	selectors().getBlockAttributes( 'storage' )?.content as string | undefined;

function text( clientId: string, content = clientId ) {
	return { ...createBlock( 'core/test-text', { content } ), clientId };
}

function storage() {
	return { ...createBlock( 'core/test-text' ), clientId: 'storage' };
}

function host( innerBlocks: Block[], source = SOURCE ) {
	return {
		...createBlock(
			'core/test-container',
			{ metadata: { bindings: { innerBlocks: { source } } } },
			innerBlocks
		),
		clientId: 'host',
	};
}

/**
 * Renders the hooks for the host, as its inner blocks controller does, and
 * takes control of its inner blocks.
 *
 * @param options              Options.
 * @param options.context      The block context.
 * @param options.ancestorKeys The bound inner blocks the host is in.
 */
function renderBoundInnerBlocks( {
	context = { 'test/key': 1 },
	ancestorKeys = [],
}: {
	context?: Record< string, unknown >;
	ancestorKeys?: string[];
} = {} ) {
	const wrapper = ( { children }: { children: ReactNode } ) => (
		<BlockContextProvider value={ context }>
			<BoundInnerBlocksAncestorsProvider value={ ancestorKeys }>
				{ children }
			</BoundInnerBlocksAncestorsProvider>
		</BlockContextProvider>
	);
	const view = renderHook(
		() => {
			const binding = useInnerBlocksBinding(
				'host',
				'core/test-container'
			);
			return binding
				? useBoundInnerBlocks( 'host', binding )
				: ( 'unbound' as const );
		},
		{ wrapper }
	);
	act( () => {
		actions().setHasBoundInnerBlocks( 'host', { editable: true } );
		actions().replaceInnerBlocks( 'host', [] );
	} );
	return view;
}

describe( 'useBoundInnerBlocks', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-container', blockSettings );
		registerBlockType( 'core/test-text', blockSettings );
		registerBlockType( 'core/test-provider', {
			...blockSettings,
			providesContext: { 'test/value': 'content' },
		} );
		// A source that reads its value from context an ancestor provides.
		registerBlockBindingsSource( {
			name: CONTEXT_SOURCE,
			label: 'Context',
			usesContext: [ 'test/value' ],
			getValues: ( {
				context,
			}: {
				context: Record< string, unknown >;
			} ) => ( { innerBlocks: context[ 'test/value' ] } ),
			setValues: ( {
				dispatch: sourceDispatch,
				bindings,
			}: {
				dispatch: typeof dispatch;
				bindings: Record< string, { newValue: string } >;
			} ) => {
				sourceDispatch( blockEditorStore ).updateBlockAttributes(
					'provider',
					{ content: bindings.innerBlocks.newValue }
				);
			},
			canUserEditValue: () => true,
		} );
		registerBlockBindingsSource( {
			name: SOURCE,
			label: 'Test',
			usesContext: [ 'test/key' ],
			getValues: () => ( { innerBlocks: getStoredValue() } ),
			setValues: ( {
				dispatch: sourceDispatch,
				bindings,
			}: {
				dispatch: typeof dispatch;
				bindings: Record< string, { newValue: string } >;
			} ) => {
				sourceDispatch( blockEditorStore ).updateBlockAttributes(
					'storage',
					{ content: bindings.innerBlocks.newValue }
				);
			},
			canUserEditValue: () => true,
		} );
	} );

	afterAll( () => {
		unregisterBlockBindingsSource( SOURCE );
		unregisterBlockBindingsSource( CONTEXT_SOURCE );
		unregisterBlockType( 'core/test-container' );
		unregisterBlockType( 'core/test-text' );
		unregisterBlockType( 'core/test-provider' );
	} );

	beforeEach( () => {
		actions().updateSettings( {
			__experimentalBlockBindingsSupportedAttributes: {
				'core/test-container': [ 'innerBlocks' ],
			},
		} );
		actions().resetBlocks( [ storage(), host( [ text( 'own' ) ] ) ] );
	} );

	it( 'uses the own inner blocks while the source has no value', () => {
		const { result } = renderBoundInnerBlocks();

		expect( result.current ).not.toBe( 'unbound' );
		expect(
			( result.current as { value: Block[] } ).value.map(
				( block ) => block.clientId
			)
		).toEqual( [ 'own' ] );
	} );

	it( 'parses the value of the source, and empties the inner blocks for an empty one', () => {
		actions().updateBlockAttributes( 'storage', {
			content: serialize( [ text( 'from-source' ) ] ),
		} );
		const { result } = renderBoundInnerBlocks();

		expect(
			( result.current as { value: Block[] } ).value.map(
				( block ) => block.attributes.content
			)
		).toEqual( [ 'from-source' ] );

		act( () => {
			actions().updateBlockAttributes( 'storage', { content: '' } );
		} );
		expect( ( result.current as { value: Block[] } ).value ).toEqual( [] );
	} );

	it( 'falls back to the own inner blocks for a value that is not block markup', () => {
		actions().updateBlockAttributes( 'storage', { content: 'Label' } );
		const { result } = renderBoundInnerBlocks();

		expect(
			( result.current as { value: Block[] } ).value.map(
				( block ) => block.clientId
			)
		).toEqual( [ 'own' ] );
	} );

	it( 'writes edits back to the source, and gives the same blocks back when the source echoes them', () => {
		actions().updateBlockAttributes( 'storage', { content: '' } );
		const { result } = renderBoundInnerBlocks();
		const edited = [ text( 'edited' ) ];

		act( () => {
			( result.current as { onChange: Function } ).onChange( edited, {} );
		} );

		expect( getStoredValue() ).toBe(
			serialize( edited, { isInnerBlocks: true } )
		);
		expect( ( result.current as { value: Block[] } ).value ).toBe( edited );
	} );

	it( 'writes no changes back that sync the inner blocks, or that it no longer controls', () => {
		actions().updateBlockAttributes( 'storage', { content: '' } );
		const { result } = renderBoundInnerBlocks();

		act( () => {
			( result.current as { onChange: Function } ).onChange(
				[ text( 'synced' ) ],
				{ undoIgnore: true }
			);
		} );
		expect( getStoredValue() ).toBe( '' );

		act( () => {
			actions().setHasBoundInnerBlocks( 'host', false );
		} );
		act( () => {
			( result.current as { onChange: Function } ).onChange(
				[ text( 'released' ) ],
				{}
			);
		} );
		expect( getStoredValue() ).toBe( '' );
	} );

	it( 'gives the source no value until the user edits the own inner blocks', () => {
		const { result } = renderBoundInnerBlocks();

		act( () => {
			( result.current as { onChange: Function } ).onChange(
				[ text( 'normalized' ) ],
				{}
			);
		} );
		expect( getStoredValue() ).toBeUndefined();

		act( () => {
			actions().replaceInnerBlocks( 'host', [ text( 'typed' ) ] );
			actions().selectBlock( 'typed' );
		} );
		act( () => {
			( result.current as { onChange: Function } ).onChange(
				[ text( 'typed', 'Typed' ) ],
				{}
			);
		} );
		expect( getStoredValue() ).toContain( 'Typed' );
	} );

	it( 'gives the change it writes back the persistence of the edit', () => {
		actions().updateBlockAttributes( 'storage', { content: '' } );
		const { result } = renderBoundInnerBlocks();
		act( () => {
			actions().replaceInnerBlocks( 'host', [ text( 'child', '' ) ] );
		} );

		act( () => {
			actions().updateBlockAttributes( 'child', { content: 'a' } );
			actions().updateBlockAttributes( 'child', { content: 'ab' } );
			( result.current as { onInput: Function } ).onInput(
				[ text( 'child', 'ab' ) ],
				{}
			);
		} );

		expect( getStoredValue() ).toContain( 'ab' );
		expect( selectors().isLastBlockChangePersistent() ).toBe( false );
	} );

	it( 'is not bound without the context the source uses', () => {
		const { result } = renderBoundInnerBlocks( { context: {} } );
		expect( result.current ).toBe( 'unbound' );
	} );

	it( 'is not bound within itself', () => {
		actions().updateBlockAttributes( 'storage', {
			content: serialize( [ text( 'from-source' ) ] ),
		} );
		const { result } = renderBoundInnerBlocks( {
			ancestorKeys: [
				`${ SOURCE }|${ serialize( [ text( 'from-source' ) ] ) }`,
			],
		} );
		expect( result.current ).toBeUndefined();
	} );

	it( 'reads the context a source uses from the ancestor that provides it, which the block context only reflects once it renders again', () => {
		const written = serialize( [ text( 'written' ) ], {
			isInnerBlocks: true,
		} );
		actions().resetBlocks( [
			{
				...createBlock( 'core/test-provider', { content: '' } ),
				clientId: 'provider',
				innerBlocks: [ host( [ text( 'own' ) ], CONTEXT_SOURCE ) ],
			},
		] );
		// The block context the host renders with stays as it was.
		const { result } = renderBoundInnerBlocks( {
			context: { 'test/value': '' },
		} );
		const edited = [ text( 'written' ) ];

		act( () => {
			( result.current as { onChange: Function } ).onChange( edited, {} );
		} );

		expect( selectors().getBlockAttributes( 'provider' )?.content ).toBe(
			written
		);
		expect( ( result.current as { value: Block[] } ).value ).toBe( edited );

		// An undo, for instance, gives the provider its previous value.
		act( () => {
			actions().updateBlockAttributes( 'provider', { content: '' } );
		} );
		expect( ( result.current as { value: Block[] } ).value ).toEqual( [] );
	} );

	it( 'is not bound for sources of attribute values', () => {
		actions().resetBlocks( [
			storage(),
			host( [ text( 'own' ) ], 'core/post-meta' ),
		] );
		expect( renderBoundInnerBlocks().result.current ).toBe( 'unbound' );
	} );

	it( 'is not bound for blocks that do not support it', () => {
		actions().updateSettings( {
			__experimentalBlockBindingsSupportedAttributes: {},
		} );
		expect( renderBoundInnerBlocks().result.current ).toBe( 'unbound' );
	} );
} );
