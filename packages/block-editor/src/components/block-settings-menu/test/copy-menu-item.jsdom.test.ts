import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { ComponentProps, ContextType } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
	createBlock,
	getBlockType,
	parse,
	registerBlockType,
	serialize,
	unregisterBlockType,
	__unstableGetInnerBlocksProps as getInnerBlocksProps,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { observableMap } from '@wordpress/compose';
import type { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { CopyMenuItem } from '../block-settings-dropdown';
import { BlockRefs } from '../../provider/block-refs-provider';
import {
	getPasteBlocks,
	requiresWrapperOnCopy,
} from '../../writing-flow/utils';
import type { BlockAttributes } from '../../../store/types';

const {
	getBlocksByClientId,
	removeBlocks,
	notifyCopy,
	getBlockRootClientId,
	getBlockName,
	getBlockAttributes,
} = vi.hoisted( () => ( {
	getBlocksByClientId: vi.fn(),
	removeBlocks: vi.fn(),
	notifyCopy: vi.fn(),
	getBlockRootClientId: vi.fn(),
	getBlockName: vi.fn(),
	getBlockAttributes: vi.fn(),
} ) );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: ( () => ( { getBlocksByClientId } ) ) as typeof useSelect,
	useDispatch: ( () => ( {
		removeBlocks,
	} ) ) as unknown as typeof useDispatch,
	useRegistry: ( () => ( {
		select: () => ( {
			getBlockType,
			getBlockRootClientId,
			getBlockName,
			getBlockAttributes,
		} ),
	} ) ) as unknown as typeof useRegistry,
} ) );

vi.mock( import( '../../../utils/use-notify-copy' ), () => ( {
	useNotifyCopy: () => notifyCopy,
} ) );

describe( 'CopyMenuItem', () => {
	const save = vi.fn(
		( { attributes }: { attributes: { content: string } } ) =>
			createElement( 'p', null, attributes.content )
	);
	let clipboardDescriptor: PropertyDescriptor | undefined;
	let execCommandDescriptor: PropertyDescriptor | undefined;
	let clipboard: {
		write: Mock<
			(
				items: { representations: Record< string, Blob > }[]
			) => Promise< void >
		>;
		writeText: Mock< ( text: string ) => Promise< void > >;
	};
	let block: Block< BlockAttributes >;
	let attributesForCopy: NonNullable<
		ContextType< typeof BlockRefs >[ 'attributesForCopy' ]
	>;

	beforeEach( () => {
		vi.clearAllMocks();
		removeBlocks.mockReset();
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
			transforms: {
				from: [
					{
						type: 'raw',
						selector: 'p',
						schema: ( { phrasingContentSchema } ) => ( {
							p: { children: phrasingContentSchema },
						} ),
					},
				],
			},
			save,
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
							getAttributesForCopy: () => ( {
								...block.attributes,
								content: 'Bound text',
							} ),
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
				.fn<
					(
						items: { representations: Record< string, Blob > }[]
					) => Promise< void >
				>()
				.mockResolvedValue( undefined ),
			writeText: vi
				.fn< ( text: string ) => Promise< void > >()
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
		for ( const name of [ 'core/list', 'core/list-item' ] ) {
			if ( getBlockType( name ) ) {
				unregisterBlockType( name );
			}
		}
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
		const { unmount } = render(
			createElement(
				BlockRefs.Provider,
				{
					value: {
						refsMap: observableMap< string, Element | null >(),
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
		return { onCopy, unmount };
	}

	it( 'copies resolved content without changing the block and marks copy success', async () => {
		const { onCopy } = renderMenuItem();

		await waitFor( () =>
			expect( notifyCopy ).toHaveBeenCalledWith( 'copy', [
				block.clientId,
			] )
		);
		expect( clipboard.writeText ).toHaveBeenCalledTimes( 1 );
		expect( clipboard.write ).not.toHaveBeenCalled();
		expect( onCopy ).toHaveBeenCalledTimes( 1 );
		expect( removeBlocks ).not.toHaveBeenCalled();
		expect( block.attributes.content ).toBe( '' );
		expect( block.attributes.metadata!.bindings!.content.source ).toBe(
			'testing/copy'
		);
	} );

	it( 'writes serialized text even when rich copy events succeed and sanitize block comments', async () => {
		const copied = new Map< string, string >();
		const setData = vi.fn( ( type: string, value: string ) => {
			copied.set(
				type,
				type === 'text/html'
					? value.replace( /<!--[\s\S]*?-->/g, '' )
					: value
			);
		} );
		vi.mocked( document.execCommand ).mockImplementation( () => {
			fireEvent.copy( screen.getByRole( 'textbox' ), {
				clipboardData: { setData },
			} );
			return true;
		} );
		clipboard.writeText.mockImplementation( async ( value ) => {
			copied.set( 'text/plain', value );
		} );
		const { onCopy } = renderMenuItem();

		await waitFor( () => expect( onCopy ).toHaveBeenCalledTimes( 1 ) );
		expect( clipboard.writeText ).toHaveBeenCalledTimes( 1 );
		expect( clipboard.write ).not.toHaveBeenCalled();
		expect( document.execCommand ).not.toHaveBeenCalled();
		expect( setData ).not.toHaveBeenCalled();
		const pasted = parse( copied.get( 'text/plain' )! );
		expect( pasted ).toMatchObject( [
			{
				isValid: true,
				attributes: {
					content: 'Bound text',
					metadata: block.attributes.metadata,
				},
			},
		] );
	} );

	it( 'removes cut blocks only after the clipboard write succeeds', async () => {
		let finishWrite!: () => void;
		clipboard.writeText.mockReturnValue(
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
		clipboard.writeText.mockRejectedValue(
			new Error( 'Clipboard denied' )
		);
		const { onCopy } = renderMenuItem( { eventType: 'cut' } );

		await waitFor( () =>
			expect( clipboard.writeText ).toHaveBeenCalledTimes( 1 )
		);
		expect( document.execCommand ).not.toHaveBeenCalled();
		expect( removeBlocks ).not.toHaveBeenCalled();
		expect( notifyCopy ).not.toHaveBeenCalled();
		expect( onCopy ).not.toHaveBeenCalled();
	} );

	it( 'preserves the binding when Cut writes serialized text', async () => {
		const copied = new Map< string, string >();
		clipboard.writeText.mockImplementation( async ( text ) => {
			copied.set( 'text/plain', text );
		} );
		removeBlocks.mockImplementation( () => {
			getBlocksByClientId.mockReturnValue( [] );
			attributesForCopy.clear();
		} );
		renderMenuItem( { eventType: 'cut' } );
		await waitFor( () =>
			expect( removeBlocks ).toHaveBeenCalledTimes( 1 )
		);
		expect( document.execCommand ).not.toHaveBeenCalled();
		expect( clipboard.write ).not.toHaveBeenCalled();

		const pasted = getPasteBlocks( {
			clipboardData: {
				getData: ( type: string ) => copied.get( type ) ?? '',
				files: [],
				items: [],
			} as unknown as DataTransfer,
		} );
		expect( console ).toHaveLogged();
		expect( pasted ).toMatchObject( [
			{
				isValid: true,
				attributes: {
					content: 'Bound text',
					metadata: block.attributes.metadata,
				},
			},
		] );
	} );

	it( 'finishes Cut after a successful write even if the menu has closed', async () => {
		let finishWrite!: () => void;
		clipboard.writeText.mockReturnValue(
			new Promise< void >( ( resolve ) => {
				finishWrite = resolve;
			} )
		);
		const { unmount } = renderMenuItem( { eventType: 'cut' } );
		unmount();
		expect( removeBlocks ).not.toHaveBeenCalled();
		finishWrite();
		await waitFor( () =>
			expect( removeBlocks ).toHaveBeenCalledWith(
				[ block.clientId ],
				false
			)
		);
		expect( notifyCopy ).toHaveBeenCalledWith( 'cut', [ block.clientId ] );
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
		const markup = serialize( [ block ] );
		save.mockClear();
		const { onCopy } = renderMenuItem();

		await waitFor( () => expect( onCopy ).toHaveBeenCalledTimes( 1 ) );
		expect( save ).toHaveBeenCalledTimes( 1 );
		expect( clipboard.writeText ).toHaveBeenCalledWith( markup );
		expect( clipboard.write ).not.toHaveBeenCalled();
	} );

	it.each( [ 'unbound', 'unresolved', 'resolved' ] )(
		'copies a List Item with its ordered List wrapper when its binding is %s',
		async ( state ) => {
			const wrapperSettings = { [ requiresWrapperOnCopy ]: true };
			registerBlockType< {
				content: string;
				metadata?: BlockAttributes[ 'metadata' ];
			} >( 'core/list-item', {
				apiVersion: 3,
				title: 'List Item',
				category: 'text',
				attributes: {
					content: { type: 'string', source: 'html', selector: 'li' },
					metadata: { type: 'object' },
				},
				...wrapperSettings,
				save: ( { attributes } ) =>
					createElement( 'li', null, attributes.content ),
			} );
			registerBlockType< { ordered: boolean } >( 'core/list', {
				apiVersion: 3,
				title: 'List',
				category: 'text',
				attributes: { ordered: { type: 'boolean' } },
				save: ( { attributes } ) =>
					createElement(
						attributes.ordered ? 'ol' : 'ul',
						getInnerBlocksProps()
					),
			} );
			block = createBlock( 'core/list-item', {
				content: 'Saved item',
				...( state === 'unbound'
					? {}
					: {
							metadata: {
								bindings: {
									content: { source: 'testing/copy' },
								},
							},
						} ),
			} );
			getBlocksByClientId.mockReturnValue( [ block ] );
			getBlockRootClientId.mockReturnValue( 'parent-list' );
			getBlockName.mockReturnValue( 'core/list' );
			getBlockAttributes.mockReturnValue( { ordered: true } );
			attributesForCopy.clear();
			if ( state !== 'unbound' ) {
				attributesForCopy.set(
					block.clientId,
					new Map( [
						[
							{},
							{
								attributes: block.attributes,
								boundAttributeNames: [ 'content' ],
								getAttributesForCopy: () =>
									state === 'resolved'
										? { content: 'Resolved item' }
										: {},
							},
						],
					] )
				);
			}
			const { onCopy } = renderMenuItem();
			await waitFor( () => expect( onCopy ).toHaveBeenCalledTimes( 1 ) );
			const pasted = parse( clipboard.writeText.mock.calls[ 0 ][ 0 ] );
			expect( pasted ).toHaveLength( 1 );
			expect( pasted[ 0 ] ).toMatchObject( {
				name: 'core/list',
				isValid: true,
				attributes: { ordered: true },
			} );
			expect( pasted[ 0 ].innerBlocks ).toHaveLength( 1 );
			expect( pasted[ 0 ].innerBlocks[ 0 ] ).toMatchObject( {
				name: 'core/list-item',
				isValid: true,
				attributes: {
					content:
						state === 'resolved' ? 'Resolved item' : 'Saved item',
				},
			} );
			expect( block.attributes.content ).toBe( 'Saved item' );
		}
	);
} );
