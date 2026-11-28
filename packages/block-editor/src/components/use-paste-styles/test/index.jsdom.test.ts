import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	serialize,
	store as blocksStore,
	unregisterBlockType,
	__unstableGetInnerBlocksProps as getInnerBlocksProps,
} from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { createElement, RawHTML } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../../store';
import {
	getClipboardBlocksContent,
	getPasteBlocks,
	requiresWrapperOnCopy,
} from '../../writing-flow/utils';
import { BLOCK_CLIPBOARD_WRAPPER } from '../../../utils/block-clipboard';
import usePasteStyles from '../';

const blockName = 'core/paste-styles-test';
const style = { typography: { fontSize: '23px' } };

function copiedMarkup() {
	return serialize( [
		createBlock( blockName, {
			content: 'Copied text',
			style,
			metadata: {
				bindings: { content: { source: 'testing/copy' } },
			},
		} ),
	] );
}

function copiedGroupMarkup() {
	return serialize( [
		createBlock( 'core/group', { style }, [
			createBlock( 'core/html', {
				content:
					'<p><!--StartFragment-->Child text<!--EndFragment--></p>',
			} ),
		] ),
	] );
}

function copiedListMarkup( copyWholeList = false ) {
	const registry = createRegistry();
	registry.register( blocksStore );
	registry.register( blockEditorStore );
	registry.dispatch( blocksStore ).addBlockTypes( getBlockTypes() );
	const item = createBlock( 'core/list-item', {
		content: '',
		fontSize: 'large',
		metadata: { bindings: { content: { source: 'testing/copy' } } },
	} );
	const list = createBlock(
		'core/list',
		{
			ordered: true,
			fontSize: 'small',
		},
		[ item ]
	);
	registry.dispatch( blockEditorStore ).resetBlocks( [ list ] );
	const attributesForCopy = new Map( [
		[
			item.clientId,
			new Map( [
				[
					{},
					{
						attributes: item.attributes,
						getAttributesForCopy: () => ( {
							...item.attributes,
							content: 'Bound item',
						} ),
						boundAttributeNames: [ 'content' ],
					},
				],
			] ),
		],
	] );
	return getClipboardBlocksContent(
		[ copyWholeList ? list : item ],
		registry,
		attributesForCopy,
		{ addWrapper: true }
	);
}

async function pasteStyles( clipboard: Partial< Clipboard > ) {
	vi.stubGlobal( 'navigator', { clipboard } );
	const registry = createRegistry();
	registry.register( blocksStore );
	registry.register( blockEditorStore );
	registry.register( noticesStore );
	registry.dispatch( blocksStore ).addBlockTypes( getBlockTypes() );
	const target = createBlock( blockName, { content: 'Target text' } );
	await registry.dispatch( blockEditorStore ).resetBlocks( [ target ] );
	const { result } = renderHook( usePasteStyles, {
		wrapper: ( { children }: { children: ReactNode } ) =>
			createElement( RegistryProvider, { value: registry }, children ),
	} );

	await act( () => result.current( [ target ] ) );

	return {
		attributes: registry
			.select( blockEditorStore )
			.getBlockAttributes( target.clientId )!,
		notices: registry.select( noticesStore ).getNotices(),
	};
}

describe( 'usePasteStyles clipboard representations', () => {
	beforeAll( () => {
		registerBlockType< {
			content: string;
			style: Record< string, unknown >;
			fontSize: string;
			metadata: Record< string, unknown >;
		} >( blockName, {
			title: 'Paste styles test',
			category: 'text',
			apiVersion: 3,
			attributes: {
				content: { type: 'string', source: 'html', selector: 'p' },
				style: { type: 'object' },
				fontSize: { type: 'string' },
				metadata: { type: 'object' },
			},
			supports: { typography: { fontSize: true } },
			save: ( { attributes } ) =>
				createElement(
					'p',
					null,
					createElement( RawHTML, null, attributes.content )
				),
		} );
		for ( const name of [ 'core/list', 'core/list-item' ] ) {
			registerBlockType< {
				content: string;
				ordered: boolean;
				fontSize: string;
				metadata: Record< string, unknown >;
			} >( name, {
				apiVersion: 3,
				title: name,
				category: 'text',
				attributes: {
					content: { type: 'string', source: 'html', selector: 'li' },
					ordered: { type: 'boolean' },
					fontSize: { type: 'string' },
					metadata: { type: 'object' },
				},
				supports: { typography: { fontSize: true } },
				...( name === 'core/list-item'
					? { [ requiresWrapperOnCopy ]: true }
					: {} ),
				save: ( { attributes } ) =>
					name === 'core/list-item'
						? createElement(
								'li',
								null,
								createElement(
									RawHTML,
									null,
									attributes.content
								)
							)
						: createElement(
								attributes.ordered ? 'ol' : 'ul',
								getInnerBlocksProps()
							),
			} );
		}
		registerBlockType< { style: Record< string, unknown > } >(
			'core/group',
			{
				apiVersion: 3,
				title: 'Group',
				category: 'design',
				attributes: { style: { type: 'object' } },
				supports: { typography: { fontSize: true } },
				save: () => createElement( 'div', getInnerBlocksProps() ),
			}
		);
		registerBlockType< { content: string } >( 'core/html', {
			apiVersion: 3,
			title: 'Custom HTML',
			category: 'text',
			attributes: { content: { type: 'string', source: 'html' } },
			save: ( { attributes } ) =>
				createElement( RawHTML, null, attributes.content ),
		} );
	} );

	afterAll( () => {
		for ( const name of [
			blockName,
			'core/list',
			'core/list-item',
			'core/group',
			'core/html',
		] ) {
			unregisterBlockType( name );
		}
	} );
	afterEach( () => vi.unstubAllGlobals() );

	it( 'reads serialized text and ignores sanitized HTML clipboard data', async () => {
		const read = vi.fn().mockResolvedValue( [] );
		const readText = vi.fn().mockResolvedValue( copiedMarkup() );
		const result = await pasteStyles( { read, readText } );

		expect( result.attributes ).toMatchObject( {
			content: 'Target text',
			style,
		} );
		expect( result.attributes.metadata ).toBeUndefined();
		expect( result.notices ).toMatchObject( [ { status: 'success' } ] );
		expect( readText ).toHaveBeenCalledOnce();
		expect( read ).not.toHaveBeenCalled();
	} );

	it( 'keeps Group styles when serialized text contains literal fragment comments', async () => {
		const text = copiedGroupMarkup();
		expect( text ).toContain( '<!--StartFragment-->' );
		const result = await pasteStyles( {
			readText: vi.fn().mockResolvedValue( text ),
		} );
		expect( result.attributes.style ).toEqual( style );
		expect( result.attributes.content ).toBe( 'Target text' );
	} );

	it.each( [ false, true ] )(
		'keeps the selected List or List Item styles in serialized text (whole list: %s)',
		async ( wholeList ) => {
			const { html } = copiedListMarkup( wholeList );
			const result = await pasteStyles( {
				readText: vi.fn().mockResolvedValue( html ),
			} );
			expect( result.attributes.fontSize ).toBe(
				wholeList ? 'small' : 'large'
			);
			expect( result.attributes.content ).toBe( 'Target text' );
			expect( result.attributes.metadata ).toBeUndefined();
			const pasted = getPasteBlocks( {
				clipboardData: {
					getData: ( type: string ) =>
						type === 'text/plain' ? html : '',
					files: [],
					items: [],
				} as unknown as DataTransfer,
			} );
			expect( console ).toHaveLogged();
			expect( pasted ).toMatchObject( [
				{
					name: 'core/list',
					isValid: true,
					attributes: { ordered: true, fontSize: 'small' },
					innerBlocks: [
						{
							name: 'core/list-item',
							isValid: true,
							attributes: {
								content: 'Bound item',
								fontSize: 'large',
								metadata: {
									bindings: {
										content: { source: 'testing/copy' },
									},
								},
							},
						},
					],
				},
			] );
			expect( serialize( pasted ) ).not.toContain(
				BLOCK_CLIPBOARD_WRAPPER
			);
		}
	);

	it( 'reports an error when the text clipboard read is denied', async () => {
		const result = await pasteStyles( {
			readText: vi.fn().mockRejectedValue( new Error( 'Denied' ) ),
		} );
		expect( result.attributes.style ).toBeUndefined();
		expect( result.notices ).toMatchObject( [ { status: 'error' } ] );
	} );

	it.each( [ 'Plain text', '<p>Plain HTML</p>' ] )(
		'warns when text contains no serialized blocks (%s)',
		async ( text ) => {
			const result = await pasteStyles( {
				readText: vi.fn().mockResolvedValue( text ),
			} );
			expect( result.attributes.style ).toBeUndefined();
			expect( result.notices ).toMatchObject( [ { status: 'warning' } ] );
		}
	);
} );
