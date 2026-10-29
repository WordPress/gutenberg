/**
 * The format restrictions of the mounted rich text fields, by block client ID
 * and then by attribute key. They are props of the fields, so this is the only
 * place where something outside a field can read them.
 */
const settings = new Map();

export function setFieldFormatSettings( clientId, attributeKey, value ) {
	if ( ! settings.has( clientId ) ) {
		settings.set( clientId, new Map() );
	}
	settings.get( clientId ).set( attributeKey, value );
}

export function deleteFieldFormatSettings( clientId, attributeKey ) {
	const fields = settings.get( clientId );
	fields?.delete( attributeKey );
	if ( fields?.size === 0 ) {
		settings.delete( clientId );
	}
}

export function getFieldFormatSettings( clientId, attributeKey ) {
	return settings.get( clientId )?.get( attributeKey );
}
