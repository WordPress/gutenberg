import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import {
	act,
	fireEvent,
	render,
	renderHook,
	screen,
} from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { createRegistry, RegistryProvider, useSelect } from '@wordpress/data';
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	createBlock,
	getBlockTypes,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import { create, store as richTextStore } from '@wordpress/rich-text';
import { useRichText } from '../../../../../rich-text/src/hook';
import copyHandler from '../../../../../rich-text/src/hook/event-listeners/copy-handler';
import { store as blockEditorStore } from '../../../store';
import useClipboardHandler from '../use-clipboard-handler';

describe( 'useClipboardHandler', () => {
	let cleanups;

	beforeAll( () => {
		registerCoreBlocks();
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	afterEach( () => {
		cleanups?.forEach( ( cleanup ) => cleanup() );
		window.getSelection().removeAllRanges();
	} );

	function mountClipboard(
		blocks,
		{ collapsed = false, supportedAttributes = [ 'content' ] } = {}
	) {
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );
		registry.register( noticesStore );
		registry.dispatch( blocksStore ).addBlockTypes( getBlockTypes() );
		const actions = registry.dispatch( blockEditorStore );
		actions.resetBlocks( blocks );
		actions.updateSettings( {
			__experimentalBlockBindingsSupportedAttributes: {
				'core/paragraph': supportedAttributes,
			},
		} );

		const [ block ] = blocks;
		const canvas = document.createElement( 'div' );
		const editable = document.createElement( 'p' );
		editable.id = `block-${ block.clientId }`;
		editable.className = 'block-editor-block-list__block';
		editable.contentEditable = 'true';
		editable.tabIndex = 0;
		editable.innerHTML = 'Bound <strong>text</strong>';
		Object.defineProperty( editable, 'isContentEditable', { value: true } );
		canvas.append( editable );
		document.body.append( canvas );
		editable.focus();

		const selection = window.getSelection();
		selection.selectAllChildren( editable );
		if ( collapsed ) {
			selection.collapseToStart();
		}
		if ( blocks.length > 1 ) {
			actions.multiSelect( block.clientId, blocks.at( -1 ).clientId );
		} else {
			actions.selectionChange(
				block.clientId,
				'content',
				0,
				collapsed ? 0 : editable.textContent.length
			);
		}

		const { result, unmount } = renderHook( useClipboardHandler, {
			wrapper: ( { children } ) =>
				createElement(
					RegistryProvider,
					{ value: registry },
					children
				),
		} );
		result.current( canvas );
		const record = {
			current: create( {
				element: editable,
				range: selection.getRangeAt( 0 ),
			} ),
		};
		const handleChange = vi.fn();
		const unsubscribe = copyHandler( {
			current: { record, handleChange },
		} )( editable );
		cleanups = [
			unsubscribe,
			() => result.current( null ),
			unmount,
			() => canvas.remove(),
		];

		return {
			registry,
			handleChange,
			copy( type = 'copy' ) {
				const clipboard = new Map();
				const event = new Event( type, {
					bubbles: true,
					cancelable: true,
				} );
				Object.defineProperty( event, 'clipboardData', {
					value: {
						getData: ( format ) => clipboard.get( format ) ?? '',
						setData: ( format, content ) =>
							clipboard.set( format, content ),
					},
				} );
				editable.dispatchEvent( event );
				return {
					plainText: event.clipboardData.getData( 'text/plain' ),
					html: event.clipboardData.getData( 'text/html' ),
				};
			},
		};
	}

	it.each( [
		{ content: { source: 'core/post-meta', args: { key: 'movie_field' } } },
		{ content: { source: 'testing/custom-source' } },
		{ __default: { source: 'core/pattern-overrides' } },
	] )(
		'copies resolved text and formatting for bound text (%j)',
		( bindings ) => {
			const block = createBlock( 'core/paragraph', {
				content: '',
				metadata: { bindings },
			} );
			const { copy, registry } = mountClipboard( [ block ] );

			expect( copy() ).toEqual( {
				plainText: 'Bound text',
				html: 'Bound <strong>text</strong>',
			} );
			const attributes = registry
				.select( blockEditorStore )
				.getBlockAttributes( block.clientId );
			expect( attributes.content.toString() ).toBe( '' );
			expect( attributes.metadata.bindings ).toEqual( bindings );
		}
	);

	it( 'copies bound text after RichText synchronizes the DOM selection', () => {
		const block = createBlock( 'core/paragraph', {
			content: '',
			metadata: {
				bindings: {
					content: { source: 'core/post-meta' },
				},
			},
		} );
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );
		registry.register( noticesStore );
		registry.register( richTextStore );
		registry.dispatch( blocksStore ).addBlockTypes( getBlockTypes() );
		const actions = registry.dispatch( blockEditorStore );
		actions.resetBlocks( [ block ] );
		actions.updateSettings( {
			__experimentalBlockBindingsSupportedAttributes: {
				'core/paragraph': [ 'content' ],
			},
		} );
		actions.selectBlock( block.clientId );

		function BoundClipboard() {
			const clipboardRef = useClipboardHandler();
			const selection = useSelect( ( select ) => {
				const { getSelectionStart, getSelectionEnd } =
					select( blockEditorStore );
				const start = getSelectionStart();
				const end = getSelectionEnd();
				const isSelected = start.attributeKey === 'content';
				return {
					isSelected,
					start: isSelected ? start.offset : undefined,
					end: isSelected ? end.offset : undefined,
				};
			}, [] );
			const { ref } = useRichText( {
				value: 'Bound <strong>text</strong>',
				selectionStart: selection.start,
				selectionEnd: selection.end,
				__unstableIsSelected: selection.isSelected,
				onChange: vi.fn(),
				onSelectionChange( start, end ) {
					actions.selectionChange(
						block.clientId,
						'content',
						start,
						end
					);
				},
			} );
			return createElement(
				'div',
				{
					ref: clipboardRef,
					role: 'textbox',
					'aria-label': 'Editor canvas',
					contentEditable: true,
					suppressContentEditableWarning: true,
					tabIndex: 0,
				},
				createElement( 'p', {
					id: `block-${ block.clientId }`,
					role: 'textbox',
					'aria-label': 'Bound content',
					className: 'block-editor-block-list__block',
					contentEditable: true,
					'data-wp-block-attribute-key': 'content',
					ref,
				} )
			);
		}

		const { unmount } = render(
			createElement(
				RegistryProvider,
				{ value: registry },
				createElement( BoundClipboard )
			)
		);
		cleanups = [ unmount ];
		const canvas = screen.getByRole( 'textbox', { name: 'Editor canvas' } );
		const editable = screen.getByRole( 'textbox', {
			name: 'Bound content',
		} );
		canvas.contentEditable = 'true';
		editable.contentEditable = 'true';
		Object.defineProperty( editable, 'isContentEditable', { value: true } );
		act( () => {
			canvas.focus();
			window.getSelection().selectAllChildren( editable );
		} );

		expect(
			registry.select( blockEditorStore ).getSelectionStart().attributeKey
		).toBeUndefined();
		const clipboard = new Map();
		const event = new Event( 'copy', {
			bubbles: true,
			cancelable: true,
		} );
		Object.defineProperty( event, 'clipboardData', {
			value: {
				getData: ( format ) => clipboard.get( format ) ?? '',
				setData: ( format, content ) =>
					clipboard.set( format, content ),
			},
		} );
		fireEvent( canvas, event );

		expect( event.clipboardData.getData( 'text/plain' ) ).toBe(
			'Bound text'
		);
		expect( event.clipboardData.getData( 'text/html' ) ).toBe(
			'Bound <strong>text</strong>'
		);
		expect(
			registry.select( blockEditorStore ).getSelectionStart().attributeKey
		).toBe( 'content' );
	} );

	it.each( [
		{ anchor: { source: 'core/post-meta', args: { key: 'movie_field' } } },
		{ __default: { source: 'testing/custom-source' } },
	] )(
		'copies the whole block when the selected attribute is not bound (%j)',
		( bindings ) => {
			const block = createBlock( 'core/paragraph', {
				content: 'Bound <strong>text</strong>',
				metadata: { bindings },
			} );
			const { copy } = mountClipboard( [ block ] );
			const copiedContent = copy();

			expect( copiedContent.plainText ).toBe( 'Bound text' );
			expect( copiedContent.html ).toContain( '<!-- wp:paragraph' );
			expect( copiedContent.html ).toContain(
				JSON.stringify( { bindings } )
			);
		}
	);

	it( 'copies the whole block when its binding is not supported', () => {
		const bindings = {
			content: { source: 'core/post-meta', args: { key: 'movie_field' } },
		};
		const block = createBlock( 'core/paragraph', {
			content: 'Bound <strong>text</strong>',
			metadata: { bindings },
		} );
		const { copy } = mountClipboard( [ block ], {
			supportedAttributes: [],
		} );
		const copiedContent = copy();

		expect( copiedContent.plainText ).toBe( 'Bound text' );
		expect( copiedContent.html ).toContain( '<!-- wp:paragraph' );
		expect( copiedContent.html ).toContain(
			JSON.stringify( { bindings } )
		);
	} );

	it( 'preserves the binding when copying with a collapsed selection', () => {
		const bindings = {
			content: { source: 'core/post-meta', args: { key: 'movie_field' } },
		};
		const block = createBlock( 'core/paragraph', {
			content: '',
			metadata: { bindings },
		} );
		const { copy } = mountClipboard( [ block ], { collapsed: true } );

		expect( copy().html ).toContain( JSON.stringify( { bindings } ) );
	} );

	it( 'copies an unbound heading as a heading block', () => {
		const block = createBlock( 'core/heading', {
			content: 'Bound <strong>text</strong>',
			level: 3,
		} );
		const { copy } = mountClipboard( [ block ] );

		expect( copy() ).toEqual( {
			plainText: 'Bound text',
			html: expect.stringContaining( '<!-- wp:heading {"level":3}' ),
		} );
	} );

	it( 'preserves bindings when copying multiple blocks', () => {
		const bindings = {
			content: { source: 'core/post-meta', args: { key: 'movie_field' } },
		};
		const blocks = [
			createBlock( 'core/paragraph', {
				content: '',
				metadata: { bindings },
			} ),
			createBlock( 'core/paragraph', { content: 'Second paragraph' } ),
		];
		const { copy } = mountClipboard( blocks );
		const copiedContent = copy();

		expect( copiedContent.html ).toContain(
			JSON.stringify( { bindings } )
		);
		expect( copiedContent.html ).toContain( '<p>Second paragraph</p>' );
	} );

	it( 'cuts the selected bound text through RichText', () => {
		const block = createBlock( 'core/paragraph', {
			content: '',
			metadata: {
				bindings: {
					content: {
						source: 'core/post-meta',
						args: { key: 'movie_field' },
					},
				},
			},
		} );
		const { copy, handleChange, registry } = mountClipboard( [ block ] );

		expect( copy( 'cut' ) ).toEqual( {
			plainText: 'Bound text',
			html: 'Bound <strong>text</strong>',
		} );
		expect( handleChange ).toHaveBeenCalledWith(
			expect.objectContaining( { text: '' } )
		);
		expect( registry.select( blockEditorStore ).getBlockCount() ).toBe( 1 );
	} );
} );
