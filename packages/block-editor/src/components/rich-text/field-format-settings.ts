import type { FieldFormatSettings } from './types';

/**
 * The format restrictions of the mounted rich text fields, by block client ID
 * and then by attribute key. They are props of the fields, so this is the only
 * place where something outside a field can read them.
 */
const settings = new Map< string, Map< string, FieldFormatSettings > >();

export function setFieldFormatSettings(
	clientId: string,
	attributeKey: string,
	value: FieldFormatSettings
) {
	if ( ! settings.has( clientId ) ) {
		settings.set( clientId, new Map() );
	}
	// Set above when missing.
	settings.get( clientId )!.set( attributeKey, value );
}

export function deleteFieldFormatSettings(
	clientId: string,
	attributeKey: string
) {
	const fields = settings.get( clientId );
	fields?.delete( attributeKey );
	if ( fields?.size === 0 ) {
		settings.delete( clientId );
	}
}

export function getFieldFormatSettings(
	clientId: string,
	attributeKey: string
) {
	return settings.get( clientId )?.get( attributeKey );
}
