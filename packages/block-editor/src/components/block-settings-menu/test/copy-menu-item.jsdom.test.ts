import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { ComponentProps, ContextType } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { observableMap } from '@wordpress/compose';
import type { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { CopyMenuItem } from '../block-settings-dropdown';
import { BlockRefs } from '../../provider/block-refs-provider';
import type { BlockAttributes } from '../../../store/types';

const { getBlocksByClientId, removeBlocks, notifyCopy } = vi.hoisted( () => ( {
	getBlocksByClientId: vi.fn(),
	removeBlocks: vi.fn(),
	notifyCopy: vi.fn(),
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: ( () => ( { getBlocksByClientId } ) ) as typeof useSelect,
	useDispatch: ( () => ( {
		removeBlocks,
	} ) ) as unknown as typeof useDispatch,
	useRegistry: ( () => ( {} ) ) as typeof useRegistry,
} ) );

vi.mock( import( '../../../utils/use-notify-copy' ), () => ( {
	useNotifyCopy: () => notifyCopy,
} ) );

describe( 'CopyMenuItem', () => {
	let clipboardDescriptor: PropertyDescriptor | undefined;
	let execCommandDescriptor: PropertyDescriptor | undefined;
	let clipboard: {
		write: Mock< () => Promise< void > >;
		writeText: Mock< () => Promise< void > >;
	};
	let block: Block< BlockAttributes >;
	let attributesForCopy: ContextType<
		typeof BlockRefs
	>[ 'attributesForCopy' ];

	beforeEach( () => {
		vi.clearAllMocks();
		registerBlockType< {
			content: string;
			metadata?: BlockAttributes[ 'metadata' ];
		} >( 'core/copy-menu-test', {
			apiVersion: 3,
			title: 'Copy test',
			category: 'text',
			attributes: {
				content: { type: 'string', source: 'html', selector: 'p' },
				metadata: { type: 'object' },
			},
			save: ( { attributes } ) =>
				createElement( 'p', null, attributes.content ),
		} );
		block = createBlock( 'core/copy-menu-test', {
			content: '',
			metadata: { bindings: { content: { source: 'testing/copy' } } },
		} );
		getBlocksByClientId.mockReturnValue( [ block ] );
		attributesForCopy = new Map( [
			[
				block.clientId,
				new Map( [
					[
						{},
						{
							attributes: block.attributes,
							computedAttributes: {
								...block.attributes,
								content: 'Bound text',
							},
							boundAttributeNames: [ 'content' ],
						},
					],
				] ),
			],
		] );
		clipboardDescriptor = Object.getOwnPropertyDescriptor(
			navigator,
			'clipboard'
		);
		execCommandDescriptor = Object.getOwnPropertyDescriptor(
			document,
			'execCommand'
		);
		clipboard = {
			write: vi
				.fn< () => Promise< void > >()
				.mockResolvedValue( undefined ),
			writeText: vi
				.fn< () => Promise< void > >()
				.mockResolvedValue( undefined ),
		};
		Object.defineProperty( navigator, 'clipboard', {
			configurable: true,
			value: clipboard,
		} );
		Object.defineProperty( document, 'execCommand', {
			configurable: true,
			value: vi.fn().mockReturnValue( false ),
		} );
		vi.stubGlobal(
			'ClipboardItem',
			class {
				representations: Record< string, Blob | PromiseLike< Blob > >;

				constructor(
					representations: Record<
						string,
						Blob | PromiseLike< Blob >
					>
				) {
					this.representations = representations;
				}
			}
		);
	} );

	afterEach( () => {
		unregisterBlockType( 'core/copy-menu-test' );
		if ( clipboardDescriptor ) {
			Object.defineProperty(
				navigator,
				'clipboard',
				clipboardDescriptor
			);
		} else {
			Reflect.deleteProperty( navigator, 'clipboard' );
		}
		if ( execCommandDescriptor ) {
			Object.defineProperty(
				document,
				'execCommand',
				execCommandDescriptor
			);
		} else {
			Reflect.deleteProperty( document, 'execCommand' );
		}
		vi.unstubAllGlobals();
	} );

	function renderMenuItem(
		props: Partial< ComponentProps< typeof CopyMenuItem > > = {}
	) {
		const onCopy = vi.fn();
		render(
			createElement(
				BlockRefs.Provider,
				{
					value: {
						refsMap: observableMap(),
						eventHandlers: new Map(),
						attributesForCopy,
					},
				},
				createElement( CopyMenuItem, {
					clientIds: [ block.clientId ],
					onCopy,
					label: undefined,
					shortcut: undefined,
					...props,
				} )
			)
		);
		fireEvent.click( screen.getByRole( 'menuitem' ) );
		return { onCopy };
	}

	it( 'copies resolved content without changing the block and marks copy success', async () => {
		const { onCopy } = renderMenuItem();

		await waitFor( () =>
			expect( notifyCopy ).toHaveBeenCalledWith( 'copy', [
				block.clientId,
			] )
		);
		expect( clipboard.write ).toHaveBeenCalledTimes( 1 );
		expect( clipboard.writeText ).not.toHaveBeenCalled();
		expect( onCopy ).toHaveBeenCalledTimes( 1 );
		expect( removeBlocks ).not.toHaveBeenCalled();
		expect( block.attributes.content ).toBe( '' );
		expect( block.attributes.metadata!.bindings!.content.source ).toBe(
			'testing/copy'
		);
	} );

	it( 'removes cut blocks only after the clipboard write succeeds', async () => {
		let finishWrite!: () => void;
		clipboard.write.mockReturnValue(
			new Promise< void >( ( resolve ) => {
				finishWrite = resolve;
			} )
		);
		const { onCopy } = renderMenuItem( {
			eventType: 'cut',
			__experimentalUpdateSelection: true,
		} );

		expect( removeBlocks ).not.toHaveBeenCalled();
		finishWrite();
		await waitFor( () =>
			expect( removeBlocks ).toHaveBeenCalledWith(
				[ block.clientId ],
				true
			)
		);
		expect( notifyCopy ).toHaveBeenCalledWith( 'cut', [ block.clientId ] );
		expect( onCopy ).not.toHaveBeenCalled();
	} );

	it( 'keeps cut blocks and omits notifications if copying fails', async () => {
		clipboard.write.mockRejectedValue( new Error( 'Clipboard denied' ) );
		const { onCopy } = renderMenuItem( { eventType: 'cut' } );

		await waitFor( () =>
			expect( document.execCommand ).toHaveBeenCalled()
		);
		expect( removeBlocks ).not.toHaveBeenCalled();
		expect( notifyCopy ).not.toHaveBeenCalled();
		expect( onCopy ).not.toHaveBeenCalled();
	} );

	it( 'keeps copy styles on the original serialization path', async () => {
		const { onCopy } = renderMenuItem( { eventType: 'copyStyles' } );

		await waitFor( () =>
			expect( notifyCopy ).toHaveBeenCalledWith( 'copyStyles', [
				block.clientId,
			] )
		);
		expect( clipboard.writeText ).toHaveBeenCalledWith(
			serialize( [ block ] )
		);
		expect( clipboard.write ).not.toHaveBeenCalled();
		expect( onCopy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps unbound blocks on the original serialization path', async () => {
		attributesForCopy.clear();
		const { onCopy } = renderMenuItem();

		await waitFor( () => expect( onCopy ).toHaveBeenCalledTimes( 1 ) );
		expect( clipboard.writeText ).toHaveBeenCalledWith(
			serialize( [ block ] )
		);
		expect( clipboard.write ).not.toHaveBeenCalled();
	} );
} );
