import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import {
	createBlock,
	parse,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import { useRegistry } from '@wordpress/data';
import type { Block } from '@wordpress/blocks';
import type { ComponentType } from '@wordpress/element';
import UntypedInnerBlocks from '../';
import BlockList from '../../block-list';
import { BlockEditorProvider } from '../../provider';
import { store as blockEditorStore } from '../../../store';
import type { BlockTemplate } from '../../../store/types';

const PARAGRAPH = 'core/paragraph';
const HEADING = 'core/heading';
const UNLOCKED = 'test/unlocked-wrapper';
const INHERITED = 'test/inherited-wrapper';
const LOCAL_TEMPLATE = 'test/local-template-wrapper';
const PROP_TEMPLATE = 'test/prop-template-wrapper';
const CONTROLLED = 'test/controlled-wrapper';
const EMPTY_TEMPLATE = 'test/empty-template-wrapper';
const CONTENT_ONLY = 'test/content-only-wrapper';
const HEADING_TEMPLATE: BlockTemplate = [ [ HEADING ] ];
const BLOCK_NAMES = [
	PARAGRAPH,
	HEADING,
	UNLOCKED,
	INHERITED,
	LOCAL_TEMPLATE,
	PROP_TEMPLATE,
	CONTROLLED,
	EMPTY_TEMPLATE,
	CONTENT_ONLY,
];

type EditorRegistry = ReturnType< typeof useRegistry >;
type WrapperAttributes = {
	orientation?: 'horizontal' | 'vertical';
	unlock?: boolean;
};
type InnerBlocksProps = {
	template?: BlockTemplate;
	templateLock?: string | false;
	orientation?: 'horizontal' | 'vertical';
	renderAppender?: false;
	value?: Block[];
	onChange?: ( blocks: Block[] ) => void;
};

// The JavaScript forwardRef component does not yet declare its props or
// attached Content component. Describe only the public surface used here.
const InnerBlocks =
	UntypedInnerBlocks as unknown as ComponentType< InnerBlocksProps > & {
		Content: ComponentType;
	};

function RegistryCapture( {
	onRegistry,
}: {
	onRegistry: ( registry: EditorRegistry ) => void;
} ) {
	onRegistry( useRegistry() );
	return null;
}

function renderEditor( blocks: Block[], template: BlockTemplate ) {
	let registry!: EditorRegistry;
	const onChange = vi.fn();
	const onInput = vi.fn();
	const settings = { template, templateLock: 'all' };
	const editor = ( value: Block[] ) => (
		<BlockEditorProvider
			value={ value }
			onChange={ onChange }
			onInput={ onInput }
			settings={ settings }
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
	// Load the saved entity through the provider, before any of its nested
	// block lists have mounted and published their InnerBlocks settings.
	view.rerender( editor( blocks ) );
	return {
		registry,
		onChange,
		onInput,
		rerenderBlocks: ( value: Block[] ) => view.rerender( editor( value ) ),
	};
}

async function waitForInnerBlocks(
	registry: EditorRegistry,
	clientId: string,
	templateLock: string | false
) {
	await waitFor( () =>
		expect(
			registry.select( blockEditorStore ).getBlockListSettings( clientId )
		).toHaveProperty( 'templateLock', templateLock )
	);
}

function paragraph( content: string ) {
	return createBlock( PARAGRAPH, { content } );
}

describe( 'root template validation with rendered InnerBlocks', () => {
	beforeEach( () => {
		registerBlockType< { content: string } >( PARAGRAPH, {
			apiVersion: 3,
			title: 'Paragraph',
			category: 'text',
			attributes: {
				content: { type: 'string', source: 'html', selector: 'p' },
			},
			edit: ( { attributes } ) => <p>{ attributes.content }</p>,
			save: ( { attributes } ) => <p>{ attributes.content }</p>,
		} );
		registerBlockType( HEADING, {
			apiVersion: 3,
			title: 'Heading',
			category: 'text',
			attributes: {},
			edit: () => <h2>Heading</h2>,
			save: () => <h2>Heading</h2>,
		} );
		const wrappers: Array< [ string, string | false | undefined ] > = [
			[ UNLOCKED, false ],
			[ INHERITED, undefined ],
			[ LOCAL_TEMPLATE, 'all' ],
			[ PROP_TEMPLATE, 'all' ],
			[ EMPTY_TEMPLATE, 'all' ],
			[ CONTENT_ONLY, 'contentOnly' ],
		];
		for ( const [ name, templateLock ] of wrappers ) {
			registerBlockType< WrapperAttributes >( name, {
				apiVersion: 3,
				title: name,
				category: 'text',
				attributes: {
					orientation: { type: 'string' },
					unlock: { type: 'boolean' },
				},
				...( name === LOCAL_TEMPLATE && {
					template: HEADING_TEMPLATE,
				} ),
				...( name === EMPTY_TEMPLATE && { template: [] } ),
				edit: ( { attributes } ) => (
					<InnerBlocks
						templateLock={
							attributes.unlock ? false : templateLock
						}
						orientation={ attributes.orientation }
						{ ...( name === PROP_TEMPLATE && {
							template: HEADING_TEMPLATE,
						} ) }
						renderAppender={ false }
					/>
				),
				save: () => (
					<div>
						<InnerBlocks.Content />
					</div>
				),
			} );
		}
		const controlledBlocks = [ paragraph( 'Separate entity content' ) ];
		registerBlockType( CONTROLLED, {
			apiVersion: 3,
			title: 'Controlled wrapper',
			category: 'text',
			attributes: {},
			edit: () => (
				<InnerBlocks
					value={ controlledBlocks }
					onChange={ () => {} }
					renderAppender={ false }
				/>
			),
			save: () => null,
		} );
	} );

	afterEach( () => {
		for ( const name of BLOCK_NAMES ) {
			unregisterBlockType( name );
		}
	} );

	it( 'accepts saved content in an explicitly unlocked area on initial load', async () => {
		const blocks = [
			createBlock( UNLOCKED, {}, [ paragraph( 'Keep me' ) ] ),
		];
		const { registry, onChange, onInput } = renderEditor( blocks, [
			[ UNLOCKED ],
		] );
		await waitForInnerBlocks( registry, blocks[ 0 ].clientId, false );
		expect( await screen.findByText( 'Keep me' ) ).toBeInTheDocument();

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual(
			blocks
		);
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'accepts the saved tree again after it is serialized and reloaded', async () => {
		const blocks = [
			createBlock( UNLOCKED, {}, [ paragraph( 'Saved content' ) ] ),
		];
		const { registry, rerenderBlocks } = renderEditor( blocks, [
			[ UNLOCKED ],
		] );
		await waitForInnerBlocks( registry, blocks[ 0 ].clientId, false );
		const reloaded = parse( serialize( blocks ) );
		rerenderBlocks( reloaded );
		await waitForInnerBlocks( registry, reloaded[ 0 ].clientId, false );

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual(
			reloaded
		);
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'continues to report a root mismatch without replacing saved content', async () => {
		const blocks = [
			createBlock( UNLOCKED, {}, [ paragraph( 'Keep me' ) ] ),
			createBlock( HEADING ),
		];
		const { registry, onChange, onInput } = renderEditor( blocks, [
			[ UNLOCKED ],
		] );
		await waitForInnerBlocks( registry, blocks[ 0 ].clientId, false );

		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual(
			blocks
		);
		expect( onChange ).not.toHaveBeenCalled();
		expect( onInput ).not.toHaveBeenCalled();
	} );

	it( 'continues to validate descendants that inherit the root template', async () => {
		const blocks = [
			createBlock( INHERITED, {}, [ createBlock( HEADING ) ] ),
		];
		const { registry } = renderEditor( blocks, [
			[ INHERITED, {}, [ [ PARAGRAPH ] ] ],
		] );
		await waitForInnerBlocks( registry, blocks[ 0 ].clientId, 'all' );

		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual(
			blocks
		);
	} );

	it( 'keeps content-only descendants locked despite an explicit unlocked child', async () => {
		const unlocked = createBlock( UNLOCKED, {}, [
			paragraph( 'Content only' ),
		] );
		const parent = createBlock( CONTENT_ONLY, {}, [ unlocked ] );
		const { registry } = renderEditor(
			[ parent ],
			[ [ CONTENT_ONLY, {}, [ [ UNLOCKED, {}, [ [ HEADING ] ] ] ] ] ]
		);
		await waitForInnerBlocks( registry, parent.clientId, 'contentOnly' );
		await waitForInnerBlocks( registry, unlocked.clientId, 'contentOnly' );

		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			parent,
		] );
	} );

	it( 'preserves unlocked descendants and their client IDs when the user resets the root template', async () => {
		const wrapper = createBlock( UNLOCKED, {}, [
			paragraph( 'Preserve this content' ),
		] );
		const { registry } = renderEditor(
			[ wrapper, createBlock( HEADING ) ],
			[ [ UNLOCKED, {}, [ [ HEADING ] ] ] ]
		);
		await waitForInnerBlocks( registry, wrapper.clientId, false );
		await act( async () => {
			registry.dispatch( blockEditorStore ).synchronizeTemplate();
		} );

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			wrapper,
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'lets an explicit local block type template own its locked descendants', async () => {
		const wrapper = createBlock( LOCAL_TEMPLATE, {}, [
			createBlock( HEADING ),
		] );
		const { registry } = renderEditor(
			[ wrapper ],
			[ [ LOCAL_TEMPLATE, {}, [ [ PARAGRAPH ] ] ] ]
		);
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			wrapper,
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'lets an explicit local template prop own its locked descendants', async () => {
		const wrapper = createBlock( PROP_TEMPLATE, {}, [
			createBlock( HEADING ),
		] );
		const { registry } = renderEditor(
			[ wrapper ],
			[ [ PROP_TEMPLATE, {}, [ [ PARAGRAPH ] ] ] ]
		);
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );

		expect( console ).toHaveWarnedWith(
			'The template prop of InnerBlocks and useInnerBlocksProps is deprecated since version 7.2. Please use a `template` declared in the block type settings instead.'
		);
		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			wrapper,
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'preserves a locked local template when resetting the root template', async () => {
		const wrapper = createBlock( LOCAL_TEMPLATE, {}, [
			createBlock( HEADING ),
		] );
		const { registry } = renderEditor(
			[ wrapper, paragraph( 'Extra root block' ) ],
			[ [ LOCAL_TEMPLATE, {}, [ [ PARAGRAPH ] ] ] ]
		);
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );
		await act( async () => {
			registry.dispatch( blockEditorStore ).synchronizeTemplate();
		} );

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			wrapper,
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'preserves a deeper unlocked area when resetting an inherited root branch', async () => {
		const unlocked = createBlock( UNLOCKED, {}, [
			paragraph( 'Deep saved content' ),
		] );
		const inherited = createBlock( INHERITED, {}, [ unlocked ] );
		const template: BlockTemplate = [
			[ INHERITED, {}, [ [ UNLOCKED, {}, [ [ HEADING ] ] ] ] ],
		];
		const { registry } = renderEditor(
			[ inherited, createBlock( HEADING ) ],
			template
		);
		await waitForInnerBlocks( registry, inherited.clientId, 'all' );
		await waitForInnerBlocks( registry, unlocked.clientId, false );
		await act( async () => {
			registry.dispatch( blockEditorStore ).synchronizeTemplate();
		} );

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			inherited,
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'keeps a dismissed root warning dismissed when unrelated inner settings change', async () => {
		const wrapper = createBlock( UNLOCKED, {}, [ paragraph( 'Keep me' ) ] );
		const blocks = [ wrapper, createBlock( HEADING ) ];
		const { registry } = renderEditor( blocks, [ [ UNLOCKED ] ] );
		await waitForInnerBlocks( registry, wrapper.clientId, false );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		await act( async () => {
			registry.dispatch( blockEditorStore ).setTemplateValidity( true );
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( wrapper.clientId, {
					orientation: 'horizontal',
				} );
		} );
		await waitFor( () =>
			expect(
				registry
					.select( blockEditorStore )
					.getBlockListSettings( wrapper.clientId )
			).toHaveProperty( 'orientation', 'horizontal' )
		);

		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
		expect(
			registry.select( blockEditorStore ).getBlocks()[ 0 ].innerBlocks
		).toEqual( wrapper.innerBlocks );
	} );

	it( 'preserves unlocked content when undo and redo restore the controlled block value', async () => {
		const wrapper = createBlock( UNLOCKED, {}, [
			paragraph( 'Undoable content' ),
		] );
		const original = [ wrapper, createBlock( HEADING ) ];
		const { registry, rerenderBlocks } = renderEditor( original, [
			[ UNLOCKED, {}, [ [ HEADING ] ] ],
		] );
		await waitForInnerBlocks( registry, wrapper.clientId, false );
		await act( async () => {
			registry.dispatch( blockEditorStore ).synchronizeTemplate();
		} );
		const resetValue = registry.select( blockEditorStore ).getBlocks();
		// Undo and redo come from the data source controlling the provider.
		rerenderBlocks( [ ...original ] );
		await waitForInnerBlocks( registry, wrapper.clientId, false );
		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual(
			original
		);
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		rerenderBlocks( resetValue );
		await waitForInnerBlocks( registry, wrapper.clientId, false );

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			wrapper,
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'keeps an explicit dismissal through later lock changes until the next reset', async () => {
		const wrapper = createBlock( INHERITED, {}, [
			paragraph( 'Keep this structure' ),
		] );
		const blocks = [ wrapper ];
		const { registry, rerenderBlocks } = renderEditor( blocks, [
			[ INHERITED ],
		] );
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		await act( async () => {
			registry.dispatch( blockEditorStore ).setTemplateValidity( true );
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( wrapper.clientId, { unlock: true } );
		} );
		await waitForInnerBlocks( registry, wrapper.clientId, false );
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( wrapper.clientId, { unlock: false } );
		} );
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
		rerenderBlocks( [ ...blocks ] );

		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual(
			blocks
		);
	} );

	it( 'revalidates the root branch after a rendered block explicitly unlocks its inner area', async () => {
		const wrapper = createBlock( INHERITED, {}, [
			paragraph( 'Now editable' ),
		] );
		const { registry } = renderEditor( [ wrapper ], [ [ INHERITED ] ] );
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( wrapper.clientId, { unlock: true } );
		} );
		await waitForInnerBlocks( registry, wrapper.clientId, false );

		expect(
			registry.select( blockEditorStore ).getBlocks()[ 0 ].innerBlocks
		).toEqual( wrapper.innerBlocks );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'revalidates freshly reset content after a previously unlocked block inherits locking again', async () => {
		const wrapper = createBlock( INHERITED, { unlock: true }, [
			paragraph( 'Locked after reload' ),
		] );
		const { registry, rerenderBlocks } = renderEditor(
			[ wrapper, createBlock( HEADING ) ],
			[ [ INHERITED ] ]
		);
		await waitForInnerBlocks( registry, wrapper.clientId, false );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		const locked = {
			...wrapper,
			attributes: { ...wrapper.attributes, unlock: false },
		};
		rerenderBlocks( [ locked ] );
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			locked,
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
	} );

	it( 'does not reuse an unlocked template boundary after the block type changes', async () => {
		const wrapper = createBlock( UNLOCKED, {}, [
			paragraph( 'Unexpected child' ),
		] );
		const { registry, rerenderBlocks } = renderEditor(
			[ wrapper ],
			[ [ HEADING ] ]
		);
		await waitForInnerBlocks( registry, wrapper.clientId, false );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		const heading = { ...wrapper, name: HEADING };
		rerenderBlocks( [ heading ] );
		expect(
			await screen.findByRole( 'heading', { name: 'Heading' } )
		).toBeInTheDocument();

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			heading,
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
	} );

	it( 'keeps separately controlled inner blocks outside the root template', async () => {
		const wrapper = createBlock( CONTROLLED );
		const { registry } = renderEditor(
			[ wrapper ],
			[ [ CONTROLLED, {}, [ [ HEADING ] ] ] ]
		);
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );
		await waitFor( () =>
			expect(
				registry
					.select( blockEditorStore )
					.areInnerBlocksControlled( wrapper.clientId )
			).toBe( true )
		);

		expect(
			registry.select( blockEditorStore ).getBlocks( wrapper.clientId )
		).toEqual( [
			expect.objectContaining( {
				name: PARAGRAPH,
				attributes: expect.objectContaining( {
					content: 'Separate entity content',
				} ),
			} ),
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'does not keep a controlled template boundary after its controller unmounts', async () => {
		const wrapper = createBlock( CONTROLLED );
		const { registry, rerenderBlocks } = renderEditor(
			[ wrapper ],
			[ [ HEADING, {}, [ [ HEADING ] ] ] ]
		);
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );
		await waitFor( () =>
			expect(
				registry
					.select( blockEditorStore )
					.areInnerBlocksControlled( wrapper.clientId )
			).toBe( true )
		);
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
		const heading = { ...wrapper, name: HEADING };
		rerenderBlocks( [ heading ] );
		expect(
			await screen.findByRole( 'heading', { name: 'Heading' } )
		).toBeInTheDocument();
		await waitFor( () =>
			expect(
				registry
					.select( blockEditorStore )
					.areInnerBlocksControlled( wrapper.clientId )
			).toBe( false )
		);

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			expect.objectContaining( {
				clientId: heading.clientId,
				name: HEADING,
			} ),
		] );
		expect(
			registry
				.select( blockEditorStore )
				.getBlocks( heading.clientId )
				.map( ( block ) => block.name )
		).not.toEqual( [ HEADING ] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			false
		);
	} );

	it( 'respects an explicit empty local template instead of inheriting the root branch', async () => {
		const wrapper = createBlock( EMPTY_TEMPLATE );
		const { registry } = renderEditor(
			[ wrapper ],
			[ [ EMPTY_TEMPLATE, {}, [ [ PARAGRAPH ] ] ] ]
		);
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );

		expect( registry.select( blockEditorStore ).getBlocks() ).toEqual( [
			wrapper,
		] );
		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );

	it( 'lets a newly created block resolve its own local template after a root reset', async () => {
		const { registry } = renderEditor(
			[ paragraph( 'Replace this root block' ) ],
			[ [ LOCAL_TEMPLATE, {}, [ [ PARAGRAPH ] ] ] ]
		);
		await act( async () => {
			registry.dispatch( blockEditorStore ).synchronizeTemplate();
		} );
		const wrapper = registry.select( blockEditorStore ).getBlocks()[ 0 ];
		await waitForInnerBlocks( registry, wrapper.clientId, 'all' );
		await waitFor( () =>
			expect(
				registry
					.select( blockEditorStore )
					.getBlocks( wrapper.clientId )
			).toEqual( [ expect.objectContaining( { name: HEADING } ) ] )
		);

		expect( registry.select( blockEditorStore ).isValidTemplate() ).toBe(
			true
		);
	} );
} );
