import { renderHook, waitFor } from '@testing-library/react';
import { createElement, isValidElement } from '@wordpress/element';
import { registerFieldType, unregisterFieldType } from '../../field-types';
import {
	registerIconResolver,
	unregisterIconResolver,
} from '../../icon-resolver';
import { useWidgetTypes } from '../use-widget-types';
import type { WidgetIcon, WidgetModuleRecord } from '../../types';

const LocationControl = () => null;

const mockModuleIcon = createElement( 'svg', {
	viewBox: '0 0 24 24',
} ) as WidgetIcon;

jest.mock(
	'test-widget/widget-module',
	() => ( {
		__esModule: true,
		default: {
			apiVersion: 1,
			title: 'Store',
			icon: mockModuleIcon,
			attributes: [
				{
					id: 'location',
					label: 'Location',
					type: 'test/location',
				},
				{ id: 'label', label: 'Label', type: 'text' },
			],
			actions: [
				{
					id: 'module-action',
					label: 'Module action',
					href: 'https://example.com/module',
					icon: mockModuleIcon,
				},
			],
		},
	} ),
	{ virtual: true }
);

jest.mock(
	'test-widget/string-icon-module',
	() => ( {
		__esModule: true,
		default: {
			title: 'String icon',
			icon: 'wordpress',
			actions: [
				{
					id: 'module-docs',
					label: 'Docs',
					href: 'https://example.com/docs',
					icon: 'wordpress',
				},
			],
		},
	} ),
	{ virtual: true }
);

const records: WidgetModuleRecord[] = [
	{
		name: 'test/store',
		widget_module: 'test-widget/widget-module',
		render_module: 'test-widget/render-module',
	},
];

const iconReferenceRecords: WidgetModuleRecord[] = [
	{ ...records[ 0 ], icon: 'core/calendar' },
];

const stringIconRecords: WidgetModuleRecord[] = [
	{
		name: 'test/string-icon',
		widget_module: 'test-widget/string-icon-module',
		render_module: 'test-widget/render-module',
	},
];

const pendingIconRecords: WidgetModuleRecord[] = [
	{ ...stringIconRecords[ 0 ], icon: 'core/pending' },
];

const actionIconRecords: WidgetModuleRecord[] = [
	{
		...records[ 0 ],
		actions: [
			{
				id: 'report',
				label: 'Open report',
				href: 'https://example.com/report',
				icon: 'core/chart-bar',
				relevance: 'high',
			},
		],
	},
];

describe( 'useWidgetTypes', () => {
	afterEach( () => {
		unregisterFieldType( 'test/location' );
		unregisterIconResolver();
	} );

	it( 'resolves named field-type references while building widget types', async () => {
		registerFieldType( {
			name: 'test/location',
			baseType: 'text',
			Edit: LocationControl,
		} );

		const { result } = renderHook( () => useWidgetTypes( records ) );

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		const [ widgetTypes ] = result.current;
		expect( widgetTypes ).toHaveLength( 1 );

		const [ location, label ] = widgetTypes[ 0 ].attributes ?? [];

		// The named reference resolved through the registry…
		expect( location ).toMatchObject( {
			id: 'location',
			type: 'text',
			Edit: LocationControl,
		} );
		// …while plain DataViews fields pass through unchanged.
		expect( label ).toMatchObject( { id: 'label', type: 'text' } );
	} );

	it( 'prefers the resolved record icon over the module element', async () => {
		const resolvedIcon = createElement( 'svg', {
			viewBox: '0 0 32 32',
		} ) as WidgetIcon;
		registerIconResolver( async () => resolvedIcon );

		const { result } = renderHook( () =>
			useWidgetTypes( iconReferenceRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );
		await waitFor( () =>
			expect( result.current[ 0 ][ 0 ].icon ).toBe( resolvedIcon )
		);
	} );

	it( 'emits widget types before icon references settle', async () => {
		registerIconResolver(
			() => new Promise< WidgetIcon | null >( () => {} )
		);

		const { result } = renderHook( () =>
			useWidgetTypes( iconReferenceRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		expect( result.current[ 0 ] ).toHaveLength( 1 );
		expect( result.current[ 0 ][ 0 ].icon ).toBe( mockModuleIcon );
	} );

	it( 'keeps the module element when the reference does not resolve', async () => {
		const { result } = renderHook( () =>
			useWidgetTypes( iconReferenceRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		expect( result.current[ 0 ][ 0 ].icon ).toBe( mockModuleIcon );
	} );

	it( 'holds the icon slot with a stand-in while the reference resolves', async () => {
		registerIconResolver(
			() => new Promise< WidgetIcon | null >( () => {} )
		);

		const { result } = renderHook( () =>
			useWidgetTypes( pendingIconRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		expect( isValidElement( result.current[ 0 ][ 0 ].icon ) ).toBe( true );
	} );

	it( 'clears the stand-in when the reference does not resolve', async () => {
		const { result } = renderHook( () =>
			useWidgetTypes( pendingIconRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );
		await waitFor( () =>
			expect( result.current[ 0 ][ 0 ].icon ).toBeUndefined()
		);
	} );

	it( 'drops a module icon that is not an element', async () => {
		const { result } = renderHook( () =>
			useWidgetTypes( stringIconRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		expect( result.current[ 0 ][ 0 ].icon ).toBeUndefined();
	} );

	it( 'resolves action icon references through the resolver', async () => {
		const resolvedIcon = createElement( 'svg', {
			viewBox: '0 0 32 32',
		} ) as WidgetIcon;
		registerIconResolver( async () => resolvedIcon );

		const { result } = renderHook( () =>
			useWidgetTypes( actionIconRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );
		await waitFor( () =>
			expect( result.current[ 0 ][ 0 ].actions?.[ 0 ].icon ).toBe(
				resolvedIcon
			)
		);
	} );

	it( 'clears the action stand-in when the reference does not resolve', async () => {
		const { result } = renderHook( () =>
			useWidgetTypes( actionIconRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );
		await waitFor( () =>
			expect(
				result.current[ 0 ][ 0 ].actions?.[ 0 ].icon
			).toBeUndefined()
		);
	} );

	it( 'holds the action icon slot with a stand-in while the reference resolves', async () => {
		registerIconResolver(
			() => new Promise< WidgetIcon | null >( () => {} )
		);

		const { result } = renderHook( () =>
			useWidgetTypes( actionIconRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		expect( result.current[ 0 ][ 0 ].actions?.[ 0 ] ).toMatchObject( {
			id: 'report',
			relevance: 'high',
		} );
		expect(
			isValidElement( result.current[ 0 ][ 0 ].actions?.[ 0 ].icon )
		).toBe( true );
	} );

	it( "keeps a module action's element icon", async () => {
		const { result } = renderHook( () => useWidgetTypes( records ) );

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		expect( result.current[ 0 ][ 0 ].actions?.[ 0 ].icon ).toBe(
			mockModuleIcon
		);
	} );

	it( 'drops a module action icon that is not an element', async () => {
		const { result } = renderHook( () =>
			useWidgetTypes( stringIconRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		expect( result.current[ 0 ][ 0 ].actions?.[ 0 ] ).toMatchObject( {
			id: 'module-docs',
		} );
		expect( result.current[ 0 ][ 0 ].actions?.[ 0 ].icon ).toBeUndefined();
	} );
} );
