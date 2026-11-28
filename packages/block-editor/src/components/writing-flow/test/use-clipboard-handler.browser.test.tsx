import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import {
	createBlock,
	getBlockType,
	registerBlockType,
	serialize,
	store as blocksStore,
	unregisterBlockType,
	__unstableGetInnerBlocksProps as getInnerBlocksProps,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { RawHTML } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '../../../store';
import useClipboardHandler from '../use-clipboard-handler';

const names = [
	'test/paragraph',
	'test/heading',
	'test/group',
	'test/forbidden',
	'test/caption',
	'test/list',
	'test/list-item',
];
let registry: ReturnType< typeof createRegistry >;

function ClipboardTarget( { blocks }: { blocks: Block[] } ) {
	return (
		<div ref={ useClipboardHandler() }>
			{ blocks.map( ( block ) => (
				<p
					key={ block.clientId }
					id={ `block-${ block.clientId }` }
					data-block={ block.clientId }
					className="block-editor-block-list__block"
					contentEditable
					suppressContentEditableWarning
				>
					{ String( block.attributes.content ?? '' ) }
				</p>
			) ) }
		</div>
	);
}

beforeEach( () => {
	for ( const name of [
		'test/paragraph',
		'test/heading',
		'test/caption',
		'test/list-item',
	] ) {
		registerBlockType< { content: string } >( name, {
			apiVersion: 3,
			title: name,
			category: 'text',
			attributes: {
				content: {
					type: 'rich-text',
					source: 'rich-text',
					selector: 'p',
					default: '',
				},
			},
			supports: { splitting: name !== 'test/caption' },
			merge: ( attributes, attributesToMerge ) => ( {
				content: attributes.content + attributesToMerge.content,
			} ),
			save: ( { attributes } ) => (
				<p>
					<RawHTML>{ String( attributes.content ) }</RawHTML>
				</p>
			),
		} );
	}
	for ( const name of [ 'test/group', 'test/list' ] ) {
		registerBlockType< Record< string, unknown > >( name, {
			apiVersion: 3,
			title: name,
			category: 'text',
			attributes: { layout: { type: 'object' } },
			save: () => <div { ...getInnerBlocksProps() } />,
			...( name === 'test/list' && {
				transforms: {
					from: [
						{
							type: 'block' as const,
							blocks: [ 'test/paragraph' ],
							transform: (
								attributes:
									| Record< string, unknown >
									| Record< string, unknown >[]
							) =>
								createBlock(
									'test/list',
									{},
									( Array.isArray( attributes )
										? attributes
										: [ attributes ]
									).map( ( item ) =>
										createBlock( 'test/list-item', item )
									)
								),
						},
					],
				},
			} ),
		} );
	}
	registerBlockType( 'test/forbidden', {
		apiVersion: 3,
		title: 'Forbidden',
		category: 'text',
		attributes: {},
		save: () => null,
	} );
	registry = createRegistry();
	registry.register( blocksStore );
	registry
		.dispatch( blocksStore )
		.addBlockTypes( names.map( ( name ) => getBlockType( name )! ) );
	registry.register( blockEditorStore );
	registry.register( noticesStore );
	registry.dispatch( blockEditorStore ).updateSettings( {
		allowedBlockTypes: names.filter(
			( name ) => name !== 'test/forbidden'
		),
	} );
} );

afterEach( () => {
	names.forEach( ( name ) => unregisterBlockType( name ) );
} );

function allowedBlocks() {
	return [
		createBlock( 'test/heading', { content: 'Heading' } ),
		createBlock( 'test/group', { layout: { type: 'flex' } }, [
			createBlock( 'test/paragraph', { content: 'Nested content' } ),
		] ),
	];
}

function mixedBlocks() {
	return [
		createBlock( 'test/forbidden' ),
		...allowedBlocks(),
		createBlock( 'test/forbidden' ),
	];
}

async function setup( {
	content = '',
	start = 0,
	end = start,
	fullySelected = false,
	name = 'test/paragraph',
	parentName,
	lastContent,
}: {
	content?: string;
	start?: number;
	end?: number;
	fullySelected?: boolean;
	name?: string;
	parentName?: string;
	lastContent?: string;
} = {} ) {
	const block = createBlock( name, { content } );
	const lastBlock =
		lastContent === undefined
			? block
			: createBlock( name, { content: lastContent } );
	const blocks = lastBlock === block ? [ block ] : [ block, lastBlock ];
	const parent = parentName
		? createBlock( parentName, {}, [ block ] )
		: undefined;
	await registry
		.dispatch( blockEditorStore )
		.resetBlocks( parent ? [ parent ] : blocks );
	if ( parent ) {
		await registry
			.dispatch( blockEditorStore )
			.updateBlockListSettings( parent.clientId, {
				allowedBlocks: [ name ],
			} );
	}
	await registry.dispatch( blockEditorStore ).selectionChange( {
		start: {
			clientId: block.clientId,
			attributeKey: fullySelected ? undefined : 'content',
			offset: fullySelected ? undefined : start,
		},
		end: {
			clientId: lastBlock.clientId,
			attributeKey: fullySelected ? undefined : 'content',
			offset: fullySelected ? undefined : end,
		},
	} );
	await render(
		<RegistryProvider value={ registry }>
			<ClipboardTarget blocks={ blocks } />
		</RegistryProvider>
	);
	const target = document.getElementById( `block-${ block.clientId }` )!;
	const lastTarget = document.getElementById(
		`block-${ lastBlock.clientId }`
	)!;
	target.focus();
	const range = document.createRange();
	range.setStart( target.firstChild ?? target, start );
	range.setEnd( lastTarget.firstChild ?? lastTarget, end );
	const selection = target.ownerDocument.defaultView!.getSelection()!;
	selection.removeAllRanges();
	selection.addRange( range );
	return target;
}

function paste( target: HTMLElement, blocks: Block[] ) {
	const clipboardData = new DataTransfer();
	clipboardData.setData( 'text/html', serialize( blocks ) );
	const event = new ClipboardEvent( 'paste', {
		bubbles: true,
		cancelable: true,
		clipboardData,
	} );
	target.dispatchEvent( event );
	expect( console ).toHaveLoggedWith(
		'Received HTML (pasteHandler):\n\n',
		serialize( blocks )
	);
	expect( console ).toHaveLoggedWith(
		'Received plain text (pasteHandler):\n\n',
		''
	);
	return event;
}

function serializedContent() {
	return serialize( registry.select( blockEditorStore ).getBlocks() );
}

describe( 'pasting blocks that are not allowed at the document root', () => {
	it.each( [ false, true ] )(
		'keeps allowed blocks when replacing a paragraph (whole-block selection: %s)',
		async ( fullySelected ) => {
			const target = await setup( { fullySelected } );
			expect( paste( target, mixedBlocks() ).defaultPrevented ).toBe(
				true
			);
			expect( serializedContent() ).toBe( serialize( allowedBlocks() ) );
		}
	);

	it( 'preserves allowed block structure at a caret', async () => {
		const target = await setup( { content: 'Before After', start: 7 } );
		expect( paste( target, mixedBlocks() ).defaultPrevented ).toBe( true );
		expect( serializedContent() ).toBe(
			serialize( [
				createBlock( 'test/paragraph', { content: 'Before ' } ),
				...allowedBlocks(),
				createBlock( 'test/paragraph', { content: 'After' } ),
			] )
		);
	} );

	it( 'preserves allowed block structure when replacing selected text', async () => {
		const target = await setup( {
			content: 'Before replace After',
			start: 7,
			end: 15,
		} );
		expect( paste( target, mixedBlocks() ).defaultPrevented ).toBe( true );
		expect( serializedContent() ).toBe(
			serialize( [
				createBlock( 'test/paragraph', { content: 'Before ' } ),
				...allowedBlocks(),
				createBlock( 'test/paragraph', { content: 'After' } ),
			] )
		);
	} );

	it.each( [ false, true ] )(
		'preserves allowed blocks across multiple selected root blocks (whole-block selection: %s)',
		async ( fullySelected ) => {
			const target = await setup( {
				content: 'Before middle',
				lastContent: 'middle After',
				start: 7,
				end: 7,
				fullySelected,
			} );
			expect(
				registry.select( blockEditorStore ).hasMultiSelection()
			).toBe( true );
			expect( paste( target, mixedBlocks() ).defaultPrevented ).toBe(
				true
			);
			expect( serializedContent() ).toBe(
				serialize(
					fullySelected
						? allowedBlocks()
						: [
								createBlock( 'test/paragraph', {
									content: 'Before ',
								} ),
								...allowedBlocks(),
								createBlock( 'test/paragraph', {
									content: 'After',
								} ),
							]
				)
			);
		}
	);

	it.each( [ false, true ] )(
		'preserves the existing fallback when every pasted block is forbidden (whole-block selection: %s)',
		async ( fullySelected ) => {
			const target = await setup( {
				content: 'Keep this',
				start: 5,
				fullySelected,
			} );
			const before = registry.select( blockEditorStore ).getBlocks();
			const selection = registry
				.select( blockEditorStore )
				.getSelectionStart();
			expect(
				paste( target, [ createBlock( 'test/forbidden' ) ] )
					.defaultPrevented
			).toBe( fullySelected );
			expect( registry.select( blockEditorStore ).getBlocks() ).toBe(
				before
			);
			expect(
				registry.select( blockEditorStore ).getSelectionStart()
			).toBe( selection );
		}
	);

	it( 'continues to paste allowed-only blocks', async () => {
		const target = await setup();
		expect( paste( target, allowedBlocks() ).defaultPrevented ).toBe(
			true
		);
		expect( serializedContent() ).toBe( serialize( allowedBlocks() ) );
	} );

	it.each( [ false, true ] )(
		'keeps the fallback for a forbidden heading with text (whole-block selection: %s)',
		async ( fullySelected ) => {
			const target = await setup( {
				content: 'Keep this',
				start: 5,
				fullySelected,
			} );
			await registry
				.dispatch( blockEditorStore )
				.updateSettings( { allowedBlockTypes: [ 'test/paragraph' ] } );
			const before = serializedContent();
			expect(
				paste( target, [
					createBlock( 'test/heading', {
						content: 'Pasted heading',
					} ),
				] ).defaultPrevented
			).toBe( fullySelected );
			expect( serializedContent() ).toBe( before );
		}
	);

	it( 'replaces entirely selected text with the allowed blocks', async () => {
		const target = await setup( { content: 'Replace this', end: 12 } );
		expect( paste( target, mixedBlocks() ).defaultPrevented ).toBe( true );
		expect( serializedContent() ).toBe( serialize( allowedBlocks() ) );
	} );

	it.each( [ 'all', 'insert' ] as const )(
		'leaves paste inline when the template is locked with %s',
		async ( templateLock ) => {
			const target = await setup( {
				content: 'Keep this',
				start: 2,
				end: 7,
			} );
			await registry
				.dispatch( blockEditorStore )
				.updateSettings( { templateLock } );
			const before = registry.select( blockEditorStore ).getBlocks();
			const selectionStart = registry
				.select( blockEditorStore )
				.getSelectionStart();
			const selectionEnd = registry
				.select( blockEditorStore )
				.getSelectionEnd();
			expect( paste( target, allowedBlocks() ).defaultPrevented ).toBe(
				false
			);
			expect( registry.select( blockEditorStore ).getBlocks() ).toBe(
				before
			);
			expect(
				registry.select( blockEditorStore ).getSelectionStart()
			).toBe( selectionStart );
			expect(
				registry.select( blockEditorStore ).getSelectionEnd()
			).toBe( selectionEnd );
		}
	);

	it( 'keeps the children of an allowed container intact', async () => {
		const target = await setup();
		const group = createBlock( 'test/group', {}, [
			createBlock( 'test/forbidden' ),
		] );
		expect(
			paste( target, [ createBlock( 'test/forbidden' ), group ] )
				.defaultPrevented
		).toBe( true );
		expect( serializedContent() ).toBe( serialize( group ) );
	} );

	it( 'leaves non-splittable fields to inline paste', async () => {
		const target = await setup( {
			name: 'test/caption',
			content: 'Caption',
			start: 3,
		} );
		const before = serializedContent();
		expect( paste( target, mixedBlocks() ).defaultPrevented ).toBe( false );
		expect( serializedContent() ).toBe( before );
	} );

	it( 'still transforms paragraphs into list items inside a list', async () => {
		const target = await setup( {
			name: 'test/list-item',
			parentName: 'test/list',
			content: 'Before After',
			start: 7,
		} );
		expect(
			paste( target, [
				createBlock( 'test/paragraph', { content: 'Pasted' } ),
			] ).defaultPrevented
		).toBe( true );
		expect( serializedContent() ).toBe(
			serialize( [
				createBlock( 'test/list', {}, [
					createBlock( 'test/list-item', {
						content: 'Before Pasted',
					} ),
					createBlock( 'test/list-item', { content: 'After' } ),
				] ),
			] )
		);
	} );
} );
