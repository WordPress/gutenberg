import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import {
	BlockEditorProvider,
	BlockList,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
// @ts-expect-error Block Library's legacy entry is intentionally untyped in the monorepo.
import * as untypedBlockLibrary from '@wordpress/block-library';
import { unlock } from '../../lock-unlock';

const COLLAPSIBLE = 'has-collapsible-appender';
const EMPTY_COLUMN_LABEL = 'Block: Column (1 of 2)';
type EditorRegistry = ReturnType< typeof useRegistry >;
type CoreBlock = { name: string; init: () => void };
const { __experimentalGetCoreBlocks, registerCoreBlocks } =
	untypedBlockLibrary as {
		__experimentalGetCoreBlocks: () => CoreBlock[];
		registerCoreBlocks: ( blocks: CoreBlock[] ) => void;
	};

function RegistryCapture( {
	onRegistry,
}: {
	onRegistry: ( registry: EditorRegistry ) => void;
} ) {
	onRegistry( useRegistry() );
	return null;
}

function paragraph() {
	return createBlock( 'core/paragraph', { content: 'Column content' } );
}

async function renderColumns( { allEmpty = false } = {} ) {
	let registry!: EditorRegistry;
	const empty = createBlock( 'core/column' );
	const child = paragraph();
	const populated = createBlock(
		'core/column',
		{},
		allEmpty ? [] : [ child ]
	);
	const columns = createBlock( 'core/columns', {}, [ empty, populated ] );
	const outside = paragraph();
	const blocks = [ columns, outside ];
	const onChange = () => {};
	const editor = ( value: Block[] ) => (
		<BlockEditorProvider
			value={ value }
			onInput={ onChange }
			onChange={ onChange }
		>
			<RegistryCapture
				onRegistry={ ( valueRegistry ) => {
					registry = valueRegistry;
				} }
			/>
			<BlockList renderAppender={ false } />
		</BlockEditorProvider>
	);
	const view = render( editor( [] ) );
	view.rerender( editor( blocks ) );
	// Let the real inserter finish publishing its initial state.
	await act( async () => {
		await Promise.resolve();
	} );
	const emptyElement = screen.getByRole( 'document', {
		name: EMPTY_COLUMN_LABEL,
	} );
	const populatedElement = screen.getByRole( 'document', {
		name: 'Block: Column (2 of 2)',
	} );
	return {
		...view,
		registry,
		empty,
		populated,
		child,
		columns,
		outside,
		emptyElement,
		populatedElement,
		emptyAppender: within( emptyElement ).getByRole( 'button', {
			name: 'Add block',
		} ),
	};
}

describe( 'empty Column editor appender eligibility', () => {
	beforeAll( () => {
		registerCoreBlocks(
			__experimentalGetCoreBlocks().filter(
				( { name }: { name: string } ) =>
					[ 'core/column', 'core/columns' ].includes( name )
			)
		);
		registerBlockType< { content: string } >( 'core/paragraph', {
			apiVersion: 3,
			title: 'Paragraph',
			category: 'text',
			attributes: { content: { type: 'string' } },
			edit: ( { attributes } ) => <p>{ attributes.content }</p>,
			save: ( { attributes } ) => <p>{ attributes.content }</p>,
		} );
	} );

	afterAll( () => {
		[ 'core/paragraph', 'core/column', 'core/columns' ].forEach(
			unregisterBlockType
		);
	} );

	it( 'marks only an empty column with a populated sibling while retaining its appender and wrapper', async () => {
		const {
			emptyElement,
			emptyAppender,
			populatedElement,
			registry,
			empty,
			columns,
		} = await renderColumns();
		await waitFor( () =>
			expect( emptyElement ).toHaveClass( COLLAPSIBLE )
		);
		expect( populatedElement ).not.toHaveClass( COLLAPSIBLE );
		expect( emptyAppender ).toBeInTheDocument();
		expect( emptyElement ).toHaveAttribute( 'data-type', 'core/column' );
		expect( emptyElement ).toHaveAttribute(
			'aria-label',
			EMPTY_COLUMN_LABEL
		);
		expect(
			registry
				.select( blockEditorStore )
				.getBlockRootClientId( empty.clientId )
		).toBe( columns.clientId );
	} );

	it( 'keeps every appender available when all columns are empty', async () => {
		const { emptyElement, populatedElement } = await renderColumns( {
			allEmpty: true,
		} );
		for ( const element of [ emptyElement, populatedElement ] ) {
			expect( element ).not.toHaveClass( COLLAPSIBLE );
			expect(
				within( element ).getByRole( 'button', { name: 'Add block' } )
			).toBeInTheDocument();
		}
	} );

	it.each( [ 'columns', 'empty', 'child' ] as const )(
		'keeps appenders available while %s is selected',
		async ( selected ) => {
			const view = await renderColumns();
			const { registry, emptyElement } = view;
			await act( async () => {
				await registry
					.dispatch( blockEditorStore )
					.selectBlock( view[ selected ].clientId );
			} );
			expect( emptyElement ).not.toHaveClass( COLLAPSIBLE );
			await act( async () => {
				await registry
					.dispatch( blockEditorStore )
					.clearSelectedBlock();
			} );
			await waitFor( () =>
				expect( emptyElement ).toHaveClass( COLLAPSIBLE )
			);
		}
	);

	it( 'preserves appenders when the Columns parent is multi-selected', async () => {
		const { registry, columns, outside, emptyElement } =
			await renderColumns();
		await act( async () => {
			await registry
				.dispatch( blockEditorStore )
				.multiSelect( columns.clientId, outside.clientId );
		} );
		expect(
			registry
				.select( blockEditorStore )
				.isBlockMultiSelected( columns.clientId )
		).toBe( true );
		expect( emptyElement ).not.toHaveClass( COLLAPSIBLE );
		await act( async () => {
			await registry.dispatch( blockEditorStore ).clearSelectedBlock();
		} );
		await waitFor( () =>
			expect( emptyElement ).toHaveClass( COLLAPSIBLE )
		);
	} );

	it( 'still marks an empty column when an unrelated block is selected', async () => {
		const { registry, outside, emptyElement } = await renderColumns();
		await act( async () => {
			await registry
				.dispatch( blockEditorStore )
				.selectBlock( outside.clientId );
		} );
		await waitFor( () =>
			expect( emptyElement ).toHaveClass( COLLAPSIBLE )
		);
	} );

	it( 'keeps appenders available when multiple sibling columns are selected', async () => {
		const { registry, empty, populated, columns, emptyElement } =
			await renderColumns();
		await act( async () => {
			await registry
				.dispatch( blockEditorStore )
				.multiSelect( empty.clientId, populated.clientId );
		} );
		expect(
			registry
				.select( blockEditorStore )
				.isBlockMultiSelected( columns.clientId )
		).toBe( false );
		expect(
			registry
				.select( blockEditorStore )
				.hasSelectedInnerBlock( columns.clientId, true )
		).toBe( true );
		expect( emptyElement ).not.toHaveClass( COLLAPSIBLE );
		await act( async () => {
			await registry.dispatch( blockEditorStore ).clearSelectedBlock();
		} );
		await waitFor( () =>
			expect( emptyElement ).toHaveClass( COLLAPSIBLE )
		);
	} );

	it( 'reveals an empty drop target as soon as an existing block starts dragging', async () => {
		const { registry, outside, emptyElement } = await renderColumns();
		await act( async () => {
			await registry
				.dispatch( blockEditorStore )
				.startDraggingBlocks( [ outside.clientId ] );
		} );
		expect( registry.select( blockEditorStore ).isDraggingBlocks() ).toBe(
			true
		);
		expect( emptyElement ).not.toHaveClass( COLLAPSIBLE );
		await act( async () => {
			await registry.dispatch( blockEditorStore ).stopDraggingBlocks();
		} );
		await waitFor( () =>
			expect( emptyElement ).toHaveClass( COLLAPSIBLE )
		);
	} );

	it( 'reveals the drop target for a global inserter or external drag without dragged blocks', async () => {
		const { registry, emptyElement } = await renderColumns();
		await act( async () => {
			unlock( registry.dispatch( blockEditorStore ) ).startDragging();
		} );
		expect( registry.select( blockEditorStore ).isDraggingBlocks() ).toBe(
			false
		);
		expect(
			unlock( registry.select( blockEditorStore ) ).isDragging()
		).toBe( true );
		expect( emptyElement ).not.toHaveClass( COLLAPSIBLE );
		await act( async () => {
			unlock( registry.dispatch( blockEditorStore ) ).stopDragging();
		} );
		await waitFor( () =>
			expect( emptyElement ).toHaveClass( COLLAPSIBLE )
		);
	} );

	it( 'updates eligibility when the group becomes completely empty and is populated again', async () => {
		const { registry, populated, emptyElement } = await renderColumns();
		await act( async () => {
			await registry
				.dispatch( blockEditorStore )
				.replaceInnerBlocks( populated.clientId, [], false );
		} );
		expect( emptyElement ).not.toHaveClass( COLLAPSIBLE );
		await act( async () => {
			await registry
				.dispatch( blockEditorStore )
				.replaceInnerBlocks(
					populated.clientId,
					[ paragraph() ],
					false
				);
		} );
		await waitFor( () =>
			expect( emptyElement ).toHaveClass( COLLAPSIBLE )
		);
	} );

	it( 'keeps the same column and appender nodes through selection and drag transitions', async () => {
		const {
			registry,
			empty,
			populated,
			columns,
			outside,
			emptyElement,
			emptyAppender,
		} = await renderColumns();
		await act( async () => {
			await registry
				.dispatch( blockEditorStore )
				.selectBlock( columns.clientId );
		} );
		await act( async () => {
			await registry.dispatch( blockEditorStore ).clearSelectedBlock();
		} );
		await act( async () => {
			await registry
				.dispatch( blockEditorStore )
				.startDraggingBlocks( [ outside.clientId ] );
		} );
		await act( async () => {
			await registry.dispatch( blockEditorStore ).stopDraggingBlocks();
		} );
		expect(
			screen.getByRole( 'document', { name: EMPTY_COLUMN_LABEL } )
		).toBe( emptyElement );
		expect(
			within( emptyElement ).getByRole( 'button', { name: 'Add block' } )
		).toBe( emptyAppender );
		expect(
			registry
				.select( blockEditorStore )
				.getBlockOrder( columns.clientId )
		).toEqual( [ empty.clientId, populated.clientId ] );
	} );
} );
