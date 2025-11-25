/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import getNormalizeFieldFunction from '.';
import type { Field, NormalizedField } from '../types';
import getValueFromId from './utils/get-value-from-id';
import hasElements from './utils/has-elements';
import setValueFromId from './utils/set-value-from-id';

/**
 * Apply default values and normalize the fields config.
 *
 * @param fields Fields config.
 * @return Normalized fields config.
 */
export default function normalizeFields< Item >(
	fields: Field< Item >[]
): NormalizedField< Item >[] {
	return fields.map( ( field ) => {
		const normalize = getNormalizeFieldFunction< Item >( field.type );

		return {
			id: field.id,
			label: field.label || field.id,
			header: field.header || field.label || field.id,
			description: field.description,
			placeholder: field.placeholder,
			getValue: field.getValue || getValueFromId( field.id ),
			setValue: field.setValue || setValueFromId( field.id ),
			elements: field.elements,
			getElements: field.getElements,
			hasElements: hasElements( field ),
			isVisible: field.isVisible,
			enableHiding: field.enableHiding ?? true,
			readOnly: field.readOnly ?? false,
			...normalize( field ),
		};
	} );
}
