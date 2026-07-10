/**
 * Field type registry.
 *
 * Names reusable DataViews field types. A registered field type bundles
 * per-field behavior (`Edit`, `render`, validation, formatting) under a
 * namespaced name; `resolveFields` translates any field referencing a
 * registered name into the plain per-field `Field` props DataViews
 * already understands. DataViews itself is never patched: names it does
 * not know degrade exactly as they do in core.
 */

/**
 * WordPress dependencies
 */
import type { Field, FieldTypeName } from '@wordpress/dataviews';

/**
 * Namespaced identifier for a registered field type, structured as
 * `<namespace>/<name>`. Both segments are lowercase, kebab-case. The
 * mandatory namespace keeps registered names disjoint from DataViews'
 * own plain type names (`text`, `media`, ...).
 */
export type RegisteredFieldTypeName = `${ string }/${ string }`;

const FIELD_TYPE_NAME_PATTERN = /^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/;

/**
 * The per-field `Field` props a field type may provide as defaults.
 * Every prop translates verbatim to the resolved field, so the registry
 * never outgrows the public DataViews field API.
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
 * A named, reusable field type: per-field behavior defaults plus an
 * optional `baseType` naming the DataViews type whose built-in defaults
 * (sort, operators, validation semantics) the resolved field inherits
 * for anything not provided here.
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
 * Registers a field type. First registration wins: a name that is
 * already registered, or is not a valid namespaced name, is ignored.
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
 * @param name Registered field type name.
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
 * @param name Field type name to look up.
 * @return The definition, or `undefined` if not registered.
 */
export function getFieldType( name: string ): FieldTypeDefinition | undefined {
	return fieldTypes.get( name );
}

/**
 * Resolves fields that reference registered field types into plain
 * DataViews fields: the registered defaults spread under the field's
 * own props (the field wins), `type` becomes the definition's
 * `baseType`, and `isValid` merges rule by rule. Fields whose `type` is
 * not registered pass through untouched, preserving DataViews' own
 * types and its unknown-type behavior.
 *
 * @param fields Fields to resolve.
 * @return Fields with registered types translated to per-field props.
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
