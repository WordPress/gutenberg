import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createElement, Fragment } from '@wordpress/element';
import { createRegistry, RegistryProvider, useSelect } from '@wordpress/data';
import {
	createBlock,
	getBlockTypes,
	parse,
	registerBlockBindingsSource,
	registerBlockType,
	store as blocksStore,
	unregisterBlockBindingsSource,
	unregisterBlockType,
} from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import Edit from '../edit';
import { BlockContextProvider } from '../../block-context';
import { PrivateBlockContext } from '../../block-list/private-block-context';
import { BlockRefsProvider } from '../../provider/block-refs-provider';
import useCanvasClipboard from '../../writing-flow/use-clipboard-handler';
import useListClipboard from '../../list-view/use-clipboard-handler';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

describe( 'copying a rendered bound block', () => {
	const blockName = 'testing/bound-paragraph';
	const sourceName = 'testing/clipboard-source';
	const bindings = { content: { source: sourceName } };
	let source;

	beforeEach( () => {
		source = {
			name: sourceName,
			label: 'Clipboard source',
			getValues: ( { select } ) => ( {
				content:
					select( blockEditorStore ).getSettings().clipboardTestValue,
			} ),
			setValues: vi.fn(),
		};
		registerBlockBindingsSource( source );
		registerBlockType( blockName, {
			apiVersion: 3,
			title: 'Bound paragraph',
			category: 'text',
			merge: ( attributes, attributesToMerge ) => ( {
				content: attributes.content + attributesToMerge.content,
			} ),
			attributes: {
				metadata: { type: 'object' },
				content: {
					type: 'string',
					source: 'html',
					selector: 'p',
					default: '',
				},
			},
			edit: ( { attributes, clientId } ) =>
				createElement( 'p', {
					id: `block-${ clientId }`,
					'data-block': clientId,
					className: 'block-editor-block-list__block',
					role: 'textbox',
					'aria-label': 'Bound paragraph',
					contentEditable: true,
					suppressContentEditableWarning: true,
					tabIndex: 0,
					dangerouslySetInnerHTML: { __html: attributes.content },
				} ),
			save: ( { attributes } ) =>
				createElement( 'p', {
					dangerouslySetInnerHTML: { __html: attributes.content },
				} ),
		} );
	} );

	afterEach( () => {
		window.getSelection().removeAllRanges();
		act( () => {
			unregisterBlockBindingsSource( sourceName );
			unregisterBlockType( blockName );
		} );
	} );

	function BoundBlock( { clientId } ) {
		const attributes = useSelect(
			( select ) =>
				select( blockEditorStore ).getBlockAttributes( clientId ),
			[ clientId ]
		);
		return createElement(
			PrivateBlockContext.Provider,
			{ value: { bindableAttributes: [ 'content' ] } },
			createElement( Edit, { name: blockName, clientId, attributes } )
		);
	}

	function Canvas( { clientId } ) {
		const clipboardRef = useCanvasClipboard();
		return createElement(
			'div',
			{ ref: clipboardRef },
			createElement( BoundBlock, { clientId } )
		);
	}

	function ListView( { clientId } ) {
		const clipboardRef = useListClipboard( { selectBlock: () => {} } );
		return createElement(
			Fragment,
			null,
			createElement( BoundBlock, { clientId } ),
			createElement(
				'div',
				{ ref: clipboardRef },
				createElement(
					'div',
					{ role: 'row', 'data-block': clientId, tabIndex: 0 },
					'Bound paragraph'
				)
			)
		);
	}

	function copyFrom( element ) {
		const clipboard = new Map();
		const event = new Event( 'copy', { bubbles: true, cancelable: true } );
		Object.defineProperty( event, 'clipboardData', {
			value: {
				setData: ( type, content ) => clipboard.set( type, content ),
				getData: ( type ) => clipboard.get( type ) ?? '',
			},
		} );
		element.focus();
		fireEvent( element, event );
		expect( event.defaultPrevented ).toBe( true );
		return {
			plainText: clipboard.get( 'text/plain' ),
			html: clipboard.get( 'text/html' ),
		};
	}

	it.each( [ 'canvas', 'list view', 'canvas with RichText endpoints' ] )(
		'copies current resolved content from the %s without changing the source',
		async ( mode ) => {
			const registry = createRegistry();
			registry.register( blocksStore );
			registry.register( blockEditorStore );
			registry.register( noticesStore );
			registry.dispatch( blocksStore ).addBlockTypes( getBlockTypes() );
			unlock( registry.dispatch( blocksStore ) ).addBlockBindingsSource(
				source
			);
			const actions = registry.dispatch( blockEditorStore );
			const boundBlock = createBlock( blockName, {
				content: '',
				metadata: { bindings },
			} );
			const normalBlock = createBlock( blockName, {
				content: 'Normal paragraph',
			} );
			actions.resetBlocks( [ boundBlock, normalBlock ] );
			actions.updateSettings( {
				clipboardTestValue: 'Bound <strong>text</strong>',
			} );
			if ( mode === 'canvas with RichText endpoints' ) {
				actions.selectionChange( {
					start: {
						clientId: boundBlock.clientId,
						attributeKey: 'content',
						offset: 0,
					},
					end: {
						clientId: normalBlock.clientId,
						attributeKey: 'content',
						offset: normalBlock.attributes.content.length,
					},
				} );
			} else {
				actions.multiSelect(
					boundBlock.clientId,
					normalBlock.clientId
				);
			}
			const Fixture = mode === 'list view' ? ListView : Canvas;
			render(
				createElement(
					RegistryProvider,
					{ value: registry },
					createElement(
						BlockRefsProvider,
						null,
						createElement(
							BlockContextProvider,
							{ value: { postId: 41, postType: 'post' } },
							createElement( Fixture, {
								clientId: boundBlock.clientId,
							} )
						)
					)
				)
			);
			const copyTarget =
				mode === 'list view'
					? screen.getByRole( 'row' )
					: screen.getByRole( 'textbox', {
							name: 'Bound paragraph',
						} );
			const copied = copyFrom( copyTarget );
			expect( copied.plainText ).toBe( 'Bound text\n\nNormal paragraph' );
			const pasted = parse( copied.html );
			expect( pasted.map( ( block ) => block.isValid ) ).toEqual( [
				true,
				true,
			] );
			expect( pasted[ 0 ].attributes ).toMatchObject( {
				content: 'Bound <strong>text</strong>',
				metadata: { bindings },
			} );
			expect( pasted[ 1 ].attributes.content ).toBe( 'Normal paragraph' );

			await act( async () => {
				await actions.updateSettings( {
					clipboardTestValue: 'Updated <em>value</em>',
				} );
			} );
			expect( copyFrom( copyTarget ).plainText ).toBe(
				'Updated value\n\nNormal paragraph'
			);
			expect(
				registry
					.select( blockEditorStore )
					.getBlockAttributes( boundBlock.clientId )
			).toMatchObject( { content: '', metadata: { bindings } } );
			expect( source.setValues ).not.toHaveBeenCalled();
		}
	);
} );
