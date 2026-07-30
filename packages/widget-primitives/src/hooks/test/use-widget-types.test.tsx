/**
 * External dependencies
 */
import { renderHook, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
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

		expect( result.current[ 0 ][ 0 ].icon ).toBe( resolvedIcon );
	} );

	it( 'keeps the module element when the reference does not resolve', async () => {
		const { result } = renderHook( () =>
			useWidgetTypes( iconReferenceRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		expect( result.current[ 0 ][ 0 ].icon ).toBe( mockModuleIcon );
	} );

	it( 'drops a module icon that is not an element', async () => {
		const { result } = renderHook( () =>
			useWidgetTypes( stringIconRecords )
		);

		await waitFor( () => expect( result.current[ 1 ] ).toBe( false ) );

		expect( result.current[ 0 ][ 0 ].icon ).toBeUndefined();
	} );
} );
