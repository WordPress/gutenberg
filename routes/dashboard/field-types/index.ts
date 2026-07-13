/**
 * WordPress dependencies
 */
import { registerFieldType } from '@wordpress/widget-primitives';
import type { FieldTypeDefinition } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { LocationControl } from './location-control';

/*
 * The field type vocabulary the dashboard page provides beyond DataViews'
 * built-in types. Widgets reference these by name, e.g.
 * `type: 'location'`.
 */
const FIELD_TYPES: FieldTypeDefinition[] = [
	{
		name: 'location',
		baseType: 'text',
		Edit: LocationControl,
	},
];

/**
 * Registers the dashboard's field types. Idempotent: the registry keeps
 * the first registration of each name.
 */
export function registerDashboardFieldTypes() {
	FIELD_TYPES.forEach( ( fieldType ) => registerFieldType( fieldType ) );
}
