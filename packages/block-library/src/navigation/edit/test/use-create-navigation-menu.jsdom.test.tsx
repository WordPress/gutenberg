import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	createBlock,
	getBlockTypes,
	parse,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import type { ReactNode } from 'react';
import { Disabled } from '@wordpress/components';
// @ts-expect-error The legacy Block Library entrypoint has no declaration file.
import { registerCoreBlocks } from '@wordpress/block-library';

vi.mock( import( '@wordpress/api-fetch' ) );

const CLASSIC_ITEMS = [
	{
		id: 10,
		parent: 0,
		menu_order: 1,
		title: { raw: 'Example', rendered: 'Example' },
		type: 'custom',
		url: 'https://example.com/',
	},
];

type NavigationPayload = { title: string; content: string; status?: string };
type NavigationMenu = {
	id: number;
	status?: string;
	title: { raw: string; rendered?: string };
	content?: { raw: string };
};
type CreateMenu = (
	title: string | null,
	blocks: Block[],
	status: string
) => Promise< NavigationMenu | undefined >;

// Load the actual legacy JS hooks without adding their unchecked dependency
// graph as roots of the package's TypeScript-only development project.
const { default: useCreateNavigationMenu } = await vi.importActual< {
	default: ( clientId?: string ) => {
		create: CreateMenu;
		isSuccess: boolean;
		isPending: boolean;
		isError: boolean;
		value: NavigationMenu | null | undefined;
	};
} >( '../use-create-navigation-menu' );
const { default: useConvertClassicToBlockMenu } = await vi.importActual< {
	default: (
		create: CreateMenu,
		options: { throwOnError: boolean }
	) => {
		convert: (
			id: number,
			name: string,
			status: string
		) => Promise< NavigationMenu | undefined >;
		status: string;
	};
} >( '../use-convert-classic-menu-to-block-menu' );
const { default: useGenerateDefaultNavigationTitle } = await vi.importActual< {
	default: ( clientId?: string ) => ( title?: string ) => Promise< string >;
} >( '../use-generate-default-navigation-title' );

describe( 'creating Navigation menus', () => {
	let registry: ReturnType< typeof createRegistry >;
	let menus: NavigationMenu[];
	let saved: NavigationPayload[];
	const registeredBlocks: string[] = [];

	beforeAll( () => {
		const existing = new Set(
			getBlockTypes().map( ( block ) => block.name )
		);
		registerCoreBlocks();
		registeredBlocks.push(
			...getBlockTypes()
				.map( ( block ) => block.name )
				.filter( ( name ) => ! existing.has( name ) )
		);
	} );

	afterAll( () => registeredBlocks.forEach( unregisterBlockType ) );

	beforeEach( () => {
		menus = [];
		saved = [];
		registry = createRegistry();
		registry.register( coreStore );
		registry.register( blockEditorStore );
		registry.dispatch( coreStore ).addEntities( [
			{
				kind: 'postType',
				name: 'wp_navigation',
				baseURL: '/wp/v2/navigation',
				rawAttributes: [ 'title', 'content' ],
			},
			{
				kind: 'postType',
				name: 'wp_template_part',
				baseURL: '/wp/v2/template-parts',
			},
		] );
		registry
			.dispatch( coreStore )
			.finishResolution( 'getEntitiesConfig', [ 'postType' ] );
		registry
			.dispatch( coreStore )
			.finishResolution( 'getEntitiesConfig', [ 'root' ] );
		vi.mocked( apiFetch ).mockReset();
		vi.mocked( apiFetch ).mockImplementation(
			async ( { path = '', method, data } ) => {
				const url = new URL( path, 'https://example.com' );
				if ( url.pathname === '/wp/v2/menu-items' ) {
					return CLASSIC_ITEMS;
				}
				if ( url.pathname === '/wp/v2/navigation' ) {
					if ( method === 'POST' ) {
						const payload = data as NavigationPayload;
						saved.push( payload );
						const record = {
							...payload,
							id: 100 + saved.length,
							title: {
								raw: payload.title,
								rendered: payload.title,
							},
							content: { raw: payload.content },
						};
						menus.push( record );
						return record;
					}
					return menus.filter(
						( menu ) =>
							menu.status === url.searchParams.get( 'status' )
					);
				}
				throw new Error( `Unexpected REST request: ${ path }` );
			}
		);
	} );

	function wrapper( { children }: { children: ReactNode } ) {
		return (
			<RegistryProvider value={ registry }>{ children }</RegistryProvider>
		);
	}

	function useImportMenu() {
		const creation = useCreateNavigationMenu( undefined );
		const conversion = useConvertClassicToBlockMenu( creation.create, {
			throwOnError: true,
		} );
		return { creation, conversion };
	}

	it( 'gives repeated imports unique titles and preserves their actual converted content', async () => {
		const { result } = renderHook( useImportMenu, { wrapper } );
		await act( async () => {
			await result.current.conversion.convert( 1, 'Primary', 'publish' );
		} );
		await act( async () => {
			await result.current.conversion.convert( 1, 'Primary', 'draft' );
		} );
		expect( saved.map( ( menu ) => menu.title ) ).toEqual( [
			'Primary',
			'Primary 2',
		] );
		expect( saved.map( ( menu ) => menu.status ) ).toEqual( [
			'publish',
			'draft',
		] );
		expect( saved[ 1 ].content ).toBe( saved[ 0 ].content );
		expect( parse( saved[ 1 ].content ) ).toEqual( [
			expect.objectContaining( {
				name: 'core/navigation-link',
				attributes: expect.objectContaining( {
					label: 'Example',
					url: 'https://example.com/',
				} ),
			} ),
		] );
		expect(
			registry
				.select( coreStore )
				.getEditedEntityRecord( 'postType', 'wp_navigation', 102 )
		).toEqual( expect.objectContaining( { status: 'publish' } ) );
		expect( result.current.creation.isSuccess ).toBe( true );
		expect( result.current.conversion.status ).toBe( 'success' );
	} );

	it.each< [ string[], string[], string | null, string ] >( [
		[ [ 'Primary' ], [ 'Primary 2', 'Primary 4' ], 'Primary', 'Primary 3' ],
		[ [ 'Primary 2' ], [ 'Primary footer' ], 'Primary', 'Primary' ],
		[ [], [ 'Primary 2', 'Primary 2 2' ], 'Primary 2', 'Primary 2 3' ],
		[
			[ 'Primary & Secondary' ],
			[],
			'Primary & Secondary',
			'Primary & Secondary 2',
		],
		[ [], [ 'Menu', 'Menu 2', 'Menu 4' ], null, 'Menu 3' ],
	] )(
		'avoids exact draft and published title collisions: %j %j',
		async ( draft, published, title, expected ) => {
			menus = [
				...draft.map( ( raw ) => ( {
					status: 'draft',
					title: { raw },
				} ) ),
				...published.map( ( raw ) => ( {
					status: 'publish',
					title: { raw },
				} ) ),
			].map( ( menu, index ) => ( { ...menu, id: index + 1 } ) );
			const { result } = renderHook(
				() => useCreateNavigationMenu( undefined ),
				{
					wrapper,
				}
			);
			await act( async () => {
				await result.current.create( title, [], 'publish' );
			} );
			expect( saved[ 0 ].title ).toBe( expected );
		}
	);

	it( 'retains the template-part area when no explicit title is supplied', async () => {
		const navigation = createBlock( 'core/navigation' );
		registry
			.dispatch( blockEditorStore )
			.resetBlocks( [
				createBlock(
					'core/template-part',
					{ slug: 'header', theme: 'test-theme' },
					[ navigation ]
				),
			] );
		const theme = {
			stylesheet: 'test-theme',
			default_template_part_areas: [
				{ area: 'header', label: 'Header' },
			],
		};
		registry
			.dispatch( coreStore )
			.receiveEntityRecords( 'root', 'theme', theme );
		registry.dispatch( coreStore ).receiveCurrentTheme( theme );
		registry
			.dispatch( coreStore )
			.finishResolution( 'getCurrentTheme', [] );
		registry
			.dispatch( coreStore )
			.receiveEntityRecords( 'postType', 'wp_template_part', {
				id: 'test-theme//header',
				area: 'header',
			} );
		registry
			.dispatch( coreStore )
			.finishResolution( 'getEntityRecord', [
				'postType',
				'wp_template_part',
				'test-theme//header',
			] );
		menus = [ { id: 1, status: 'publish', title: { raw: 'Header menu' } } ];
		const { result } = renderHook(
			() => useCreateNavigationMenu( navigation.clientId ),
			{ wrapper }
		);
		await act( async () => {
			await result.current.create( null, [], 'publish' );
		} );
		expect( saved[ 0 ].title ).toBe( 'Header menu 2' );
	} );

	it( 'waits for the existing menus before saving an explicit title', async () => {
		const { promise: response, resolve: resolveMenus } =
			Promise.withResolvers< NavigationMenu[] >();
		const transport = vi.mocked( apiFetch ).getMockImplementation();
		vi.mocked( apiFetch ).mockImplementation( ( options ) =>
			options.method === 'POST' ? transport!( options ) : response
		);
		const { result } = renderHook(
			() => useCreateNavigationMenu( undefined ),
			{
				wrapper,
			}
		);
		let creation: ReturnType< typeof result.current.create > | undefined;
		await act( async () => {
			creation = result.current.create( 'Primary', [], 'publish' );
			await Promise.resolve();
		} );
		await waitFor( () =>
			expect(
				vi
					.mocked( apiFetch )
					.mock.calls.filter( ( [ options ] ) =>
						options.path?.includes( '/navigation?' )
					)
			).toHaveLength( 2 )
		);
		expect( saved ).toHaveLength( 0 );
		expect( result.current.isPending ).toBe( true );
		await act( async () => {
			resolveMenus( [] );
			await creation;
		} );
		expect( saved[ 0 ].title ).toBe( 'Primary' );
	} );

	it( 'does not resolve menu collections for disabled previews', async () => {
		function disabledWrapper( { children }: { children: ReactNode } ) {
			return (
				<RegistryProvider value={ registry }>
					<Disabled>{ children }</Disabled>
				</RegistryProvider>
			);
		}
		const { result } = renderHook(
			() => useGenerateDefaultNavigationTitle( undefined ),
			{ wrapper: disabledWrapper }
		);
		expect( await result.current( undefined ) ).toBe( '' );
		expect( apiFetch ).not.toHaveBeenCalled();
		const { result: creation } = renderHook(
			() => useCreateNavigationMenu( undefined ),
			{ wrapper: disabledWrapper }
		);
		await act( async () => {
			await creation.current.create( 'Primary', [], 'publish' );
		} );
		expect( saved[ 0 ].title ).toBe( 'Primary' );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'retains creation error state when the save request fails', async () => {
		const transport = vi.mocked( apiFetch ).getMockImplementation();
		vi.mocked( apiFetch ).mockImplementation( ( options ) =>
			options.method === 'POST'
				? Promise.reject( {
						code: 'rest_error',
						message: 'Save failed',
					} )
				: transport!( options )
		);
		const { result } = renderHook(
			() => useCreateNavigationMenu( undefined ),
			{
				wrapper,
			}
		);
		await act( async () => {
			await expect(
				result.current.create( 'Primary', [], 'draft' )
			).rejects.toThrow( 'Unable to save new Navigation Menu' );
		} );
		expect( result.current.isError ).toBe( true );
		expect( result.current.value ).toBeFalsy();
		expect( saved ).toHaveLength( 0 );
	} );
} );
