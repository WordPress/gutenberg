/**
 * Field type registry.
 *
 * This registry contains reusable DataViews field types identified
 * by unique names.
 *
 * Each registered field type defines specific behavior for individual
 * fields, including editing, rendering, validation, and formatting.
 *
 * The `resolveFields` function converts any reference to a registered name
 * into the standard per-field `Field` properties that DataViews recognizes.
 */

/**
 * WordPress dependencies
 */
import type { Field, FieldTypeName } from '@wordpress/dataviews';

/**
 * Any lowercase name, plain (`location`) or namespaced (`acme/rating`).
 * The `string & {}` form keeps DataViews' native names as IDE
 * suggestions when unioned with `FieldTypeName`.
 */
export type RegisteredFieldTypeName = string & {};

const FIELD_TYPE_NAME_PATTERN = /^[a-z][a-z0-9-]*(\/[a-z][a-z0-9-]*)?$/;

/**
 * The per-field `Field` props a field type may provide as defaults.
 *
 * Every prop translates verbatim to the resolved field,
 * so the registry never outgrows the public DataViews field API.
 */
type FieldTypeDefaults< Item > = Pick<
	Field< Item >,
	| 'Edit'
	| 'render'
	| 'sort'
	| 'isValid'
	| 'getValueFormatted'
	| 'format'
	| 'enableSorting'
	| 'enableGlobalSearch'
	| 'filterBy'
>;

/**
 * A named, reusable field type: per-field behavior defaults plus
 * an optional `baseType` that names the DataViews type whose
 * built-in defaults (sort, operators, validation semantics)
 * the resolved field inherits for anything not provided here.
 */
export interface FieldTypeDefinition< Item = unknown >
	extends FieldTypeDefaults< Item > {
	name: RegisteredFieldTypeName;
	baseType?: FieldTypeName;
}

/**
 * A DataViews `Field` whose `type` may also reference a registered
 * field type by name.
 */
export type ResolvableField< Item = unknown > = Omit<
	Field< Item >,
	'type'
> & {
	type?: FieldTypeName | RegisteredFieldTypeName;
};

const fieldTypes = new Map< string, FieldTypeDefinition< any > >();

/**
 * Registers a field type.
 *
 * First registration wins: a name that is
 * already registered, or is not a valid name, is ignored.
 *
 * @param fieldType Field type definition to register.
 * @return The registered definition, or `undefined` when ignored.
 */
export function registerFieldType< Item = unknown >(
	fieldType: FieldTypeDefinition< Item >
): FieldTypeDefinition< Item > | undefined {
	if (
		! FIELD_TYPE_NAME_PATTERN.test( fieldType.name ) ||
		fieldTypes.has( fieldType.name )
	) {
		return undefined;
	}

	fieldTypes.set( fieldType.name, fieldType );
	return fieldType;
}

/**
 * Unregisters a field type.
 *
 * @param {RegisteredFieldTypeName} name Registered field type name.
 * @return The removed definition, or `undefined` if it was not registered.
 */
export function unregisterFieldType(
	name: RegisteredFieldTypeName
): FieldTypeDefinition | undefined {
	const fieldType = fieldTypes.get( name );
	fieldTypes.delete( name );

	return fieldType;
}

/**
 * Returns a registered field type definition.
 *
 * @param {RegisteredFieldTypeName} name Field type name to look up.
 * @return The definition, or `undefined` if not registered.
 */
export function getFieldType(
	name: RegisteredFieldTypeName
): FieldTypeDefinition | undefined {
	return fieldTypes.get( name );
}

/**
 * Converts fields referencing registered field types into
 * plain DataViews fields: default settings are merged into the field's
 * own properties (giving the field precedence), `type` is updated to
 * the `baseType` from the definition, and `isValid` is combined rule by rule.
 *
 * Fields with an unregistered `type` remain unchanged, maintaining DataViews' original types and handling of unknown types.
 *
 * @param fields - The fields to be resolved.
 * @return Fields with registered types converted into specific properties per field.
 */
export function resolveFields< F extends ResolvableField< any > >(
	fields: F[]
): ( Omit< F, 'type' > & { type?: FieldTypeName } )[] {
	return fields.map( ( field ) => {
		const fieldType = field.type ? fieldTypes.get( field.type ) : undefined;

		if ( ! fieldType ) {
			return field as Omit< F, 'type' > & { type?: FieldTypeName };
		}

		const { name, baseType, isValid, ...fieldDefaults } = fieldType;
		const { type, isValid: fieldIsValid, ...rest } = field;

		return {
			...fieldDefaults,
			...rest,
			type: baseType,
			...( isValid || fieldIsValid
				? { isValid: { ...isValid, ...fieldIsValid } }
				: {} ),
		} as unknown as Omit< F, 'type' > & { type?: FieldTypeName };
	} );
}
