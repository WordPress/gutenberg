/**
 * The format restrictions of the mounted rich text fields, by block client ID
 * and attribute key. They are props of the fields, so this is the only place
 * where something outside a field can read them.
 */
const settings = new Map();

function keyFor( clientId, attributeKey ) {
	return `${ clientId }/${ attributeKey }`;
}

export function setFieldFormatSettings( clientId, attributeKey, value ) {
	settings.set( keyFor( clientId, attributeKey ), value );
}

export function deleteFieldFormatSettings( clientId, attributeKey ) {
	settings.delete( keyFor( clientId, attributeKey ) );
}

export function getFieldFormatSettings( clientId, attributeKey ) {
	return settings.get( keyFor( clientId, attributeKey ) );
}
