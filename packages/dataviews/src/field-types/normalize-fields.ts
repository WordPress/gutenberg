/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import getNormalizeFieldFunction from '.';
import { getControl } from '../dataform-controls';
import type { Field, NormalizedField, SortDirection } from '../types';
import getFilterBy from './utils/get-filter-by';
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
		const defaultProps = normalize( field );

		const getValue = field.getValue || getValueFromId( field.id );
		const sort = function ( a: any, b: any, direction: SortDirection ) {
			const aValue = getValue( a );
			const bValue = getValue( b );
			return field.sort
				? field.sort( aValue, bValue, direction )
				: defaultProps.sort( aValue, bValue, direction );
		};

		return {
			id: field.id,
			label: field.label || field.id,
			header: field.header || field.label || field.id,
			description: field.description,
			placeholder: field.placeholder,
			getValue,
			setValue: field.setValue || setValueFromId( field.id ),
			elements: field.elements,
			getElements: field.getElements,
			hasElements: hasElements( field ),
			isVisible: field.isVisible,
			enableHiding: field.enableHiding ?? true,
			readOnly: field.readOnly ?? false,
			// The type provides defaults for the following props
			type: defaultProps.type,
			render: field.render ?? defaultProps.render,
			Edit: getControl( field, defaultProps.Edit ),
			sort,
			enableSorting: field.enableSorting ?? defaultProps.enableSorting,
			enableGlobalSearch:
				field.enableGlobalSearch ?? defaultProps.enableGlobalSearch,
			isValid: {
				...defaultProps.isValid,
				...field.isValid,
			},
			filterBy: getFilterBy(
				field,
				defaultProps.defaultOperators,
				defaultProps.validOperators
			),
			format: defaultProps.getFormat( field ),
		};
	} );
}
