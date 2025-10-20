/**
 * Internal dependencies
 */
import type {
	NormalizedFormField,
	NormalizedCombinedFormField,
} from '../types';

export function isCombinedField(
	field: NormalizedFormField
): field is NormalizedCombinedFormField {
	return ( field as NormalizedCombinedFormField ).children !== undefined;
}
