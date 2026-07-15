/**
 * External dependencies
 */
import { renderHook, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { registerFieldType, unregisterFieldType } from '../../field-types';
import { useWidgetTypes } from '../use-widget-types';
import type { WidgetModuleRecord } from '../../types';

const LocationControl = () => null;

jest.mock(
	'test-widget/widget-module',
	() => ( {
		__esModule: true,
		default: {
			apiVersion: 1,
			title: 'Store',
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

const records: WidgetModuleRecord[] = [
	{
		name: 'test/store',
		widget_module: 'test-widget/widget-module',
		render_module: 'test-widget/render-module',
	},
];

describe( 'useWidgetTypes', () => {
	afterEach( () => {
		unregisterFieldType( 'test/location' );
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
} );
