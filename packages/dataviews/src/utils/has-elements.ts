/**
 * Internal dependencies
 */
import type { Field } from '../types/field-api';

export default function hasElements< Item >( field: Field< Item > ): boolean {
	return (
		( Array.isArray( field.elements ) && field.elements.length > 0 ) ||
		typeof field.getElements === 'function'
	);
}
