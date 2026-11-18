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
} from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { createElement, RawHTML } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../../store';
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

function clipboardItem( representations: Record< string, string | Error > ) {
	return {
		types: Object.keys( representations ),
		getType: vi.fn( async ( type: string ) => {
			const value = representations[ type ];
			if ( typeof value !== 'string' ) {
				throw value;
			}
			return { text: async () => value } as Blob;
		} ),
	} as unknown as ClipboardItem;
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
			metadata: Record< string, unknown >;
		} >( blockName, {
			title: 'Paste styles test',
			category: 'text',
			apiVersion: 3,
			attributes: {
				content: { type: 'string', source: 'html', selector: 'p' },
				style: { type: 'object' },
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
	} );

	afterAll( () => unregisterBlockType( blockName ) );
	afterEach( () => vi.unstubAllGlobals() );

	it( 'uses serialized HTML and applies only its styles', async () => {
		const readText = vi.fn();
		const result = await pasteStyles( {
			read: vi.fn().mockResolvedValue( [
				clipboardItem( {
					'text/html': copiedMarkup(),
					'text/plain': 'Copied text',
				} ),
			] ),
			readText,
		} );

		expect( result.attributes ).toMatchObject( {
			content: 'Target text',
			style,
		} );
		expect( result.attributes.metadata ).toBeUndefined();
		expect( result.notices ).toMatchObject( [ { status: 'success' } ] );
		expect( readText ).not.toHaveBeenCalled();
	} );

	it( 'uses the same item plain text when its HTML representation is unavailable', async () => {
		const item = clipboardItem( {
			'text/html': new DOMException(
				'Unavailable HTML',
				'NotFoundError'
			),
			'text/plain': copiedMarkup(),
		} );
		const readText = vi
			.fn()
			.mockRejectedValue(
				new DOMException(
					'No second clipboard activation',
					'NotAllowedError'
				)
			);
		const result = await pasteStyles( {
			read: vi.fn().mockResolvedValue( [ item ] ),
			readText,
		} );

		expect( result.attributes.style ).toEqual( style );
		expect( item.getType ).toHaveBeenCalledWith( 'text/plain' );
		expect( readText ).not.toHaveBeenCalled();
		expect( result.notices ).toMatchObject( [ { status: 'success' } ] );
	} );

	it( 'uses the next item when an HTML blob cannot be read', async () => {
		const unavailableItem = {
			types: [ 'text/html' ],
			getType: vi.fn().mockResolvedValue( {
				text: vi
					.fn()
					.mockRejectedValue( new Error( 'Unreadable HTML' ) ),
			} ),
		} as unknown as ClipboardItem;
		const readText = vi
			.fn()
			.mockRejectedValue(
				new DOMException(
					'No second clipboard activation',
					'NotAllowedError'
				)
			);
		const result = await pasteStyles( {
			read: vi
				.fn()
				.mockResolvedValue( [
					unavailableItem,
					clipboardItem( { 'text/html': copiedMarkup() } ),
				] ),
			readText,
		} );

		expect( result.attributes.style ).toEqual( style );
		expect( readText ).not.toHaveBeenCalled();
	} );

	it( 'reads serialized plain text when the HTML has no block data', async () => {
		const readText = vi.fn();
		const result = await pasteStyles( {
			read: vi.fn().mockResolvedValue( [
				clipboardItem( {
					'text/html': '<p>Copied text</p>',
					'text/plain': copiedMarkup(),
				} ),
			] ),
			readText,
		} );

		expect( result.attributes.style ).toEqual( style );
		expect( readText ).not.toHaveBeenCalled();
	} );

	it.each( [ 'unavailable', 'denied' ] )(
		'reads legacy serialized text when rich reading is %s',
		async ( richReading ) => {
			const readText = vi.fn().mockResolvedValue( copiedMarkup() );
			const result = await pasteStyles( {
				...( richReading === 'denied'
					? {
							read: vi
								.fn()
								.mockRejectedValue( new Error( 'Denied' ) ),
						}
					: {} ),
				readText,
			} );

			expect( result.attributes.style ).toEqual( style );
			expect( readText ).toHaveBeenCalledOnce();
		}
	);

	it( 'reads legacy serialized text after all item representations fail', async () => {
		const readText = vi.fn().mockResolvedValue( copiedMarkup() );
		const result = await pasteStyles( {
			read: vi.fn().mockResolvedValue( [
				clipboardItem( {
					'text/html': new Error( 'Unreadable HTML' ),
				} ),
			] ),
			readText,
		} );

		expect( result.attributes.style ).toEqual( style );
		expect( readText ).toHaveBeenCalledOnce();
	} );

	it( 'reports an error when the item and legacy read are denied', async () => {
		const result = await pasteStyles( {
			read: vi.fn().mockResolvedValue( [
				clipboardItem( {
					'text/html': new Error( 'Denied HTML' ),
				} ),
			] ),
			readText: vi.fn().mockRejectedValue( new Error( 'Denied' ) ),
		} );

		expect( result.attributes.style ).toBeUndefined();
		expect( result.notices ).toMatchObject( [ { status: 'error' } ] );
	} );

	it( 'warns when readable representations contain no serialized blocks', async () => {
		const result = await pasteStyles( {
			read: vi.fn().mockResolvedValue( [
				clipboardItem( {
					'text/html': '<p>Plain HTML</p>',
					'text/plain': 'Plain text',
				} ),
			] ),
			readText: vi.fn(),
		} );

		expect( result.attributes.style ).toBeUndefined();
		expect( result.notices ).toMatchObject( [ { status: 'warning' } ] );
	} );

	it( 'reports an error when both clipboard reads are denied', async () => {
		const result = await pasteStyles( {
			read: vi.fn().mockRejectedValue( new Error( 'Denied' ) ),
			readText: vi.fn().mockRejectedValue( new Error( 'Denied' ) ),
		} );

		expect( result.attributes.style ).toBeUndefined();
		expect( result.notices ).toMatchObject( [ { status: 'error' } ] );
	} );
} );
