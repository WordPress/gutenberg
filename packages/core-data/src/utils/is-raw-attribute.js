/**
 * Checks whether the attribute is a "raw" attribute or not.
 *
 * @param {Object} entity    Entity record.
 * @param {string} attribute Attribute name.
 *
 * @return {boolean} Is the attribute raw
 */
export default function isRawAttribute( entity, attribute ) {
	return ( entity.rawAttributes || [] ).includes( attribute );
}
