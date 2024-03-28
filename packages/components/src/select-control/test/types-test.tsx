/**
 * Internal dependencies
 */
import SelectControl from '..';

/**
 * Single type
 */
// Normal select, no generic or option provided. Any value is allowed here.
<SelectControl value="string" multiple={ false } />;

// Normal select, no generic provided. Value type is inferred from available options.
<SelectControl
	value="string"
	multiple={ false }
	options={ [
		{
			value: 'string',
			label: 'String',
		},
		{
			value: 'otherstring',
			label: 'Other String',
		},
	] }
/>;

// Normal select, no generic provided. Value type is inferred from available options.
// Incorrect value type provided to test validation is working.
<SelectControl
	// @ts-expect-error "string" is not "narrow" or "value", so throw an error
	value="string"
	multiple={ false }
	options={ [
		{
			value: 'narrow',
			label: 'Narrow',
		},
		{
			value: 'value',
			label: 'Value',
		},
	] }
	onChange={ ( value ) => {
		// Typescript can't guarantee the value isn't modified by the
		// user, so we can't assign a type to value here.
		return value === 'string';
	} }
/>;

// Select with explicit generic provided.
// Both value and options.value must match the provided generic.
<SelectControl< 'narrow' | 'value' >
	value="narrow"
	options={ [
		{
			value: 'narrow',
			label: 'Narrow',
		},
		{
			value: 'value',
			label: 'Value',
		},
	] }
	multiple={ false }
/>;

// Select with explicit generic provided.
// Both value and options.value must match the provided generic.
// Incorrect value type provided to test validation is working.
<SelectControl< 'narrow' | 'value' >
	// @ts-expect-error "string" is not "narrow" or "value", so throw an error
	value="string"
	multiple={ false }
	options={ [
		{
			// @ts-expect-error "string" is not "narrow" or "value", so throw an error
			value: 'string',
			label: 'String',
		},
		{
			// @ts-expect-error "otherstring" is not "narrow" or "value", so throw an error
			value: 'otherstring',
			label: 'Other String',
		},
	] }
/>;

// Select with explicit generic provided.
// Usually this would result in a type error with no generic,
// but this has been explicitly loosened to bypass errors.
<SelectControl< string >
	value="string"
	multiple={ false }
	options={ [
		{
			value: 'narrow',
			label: 'Narrow',
		},
		{
			value: 'value',
			label: 'Value',
		},
	] }
/>;

/**
 * Multiple type
 */
// Normal select, no generic or option provided. Any value is allowed here.
<SelectControl value={ [ 'string' ] } multiple />;

// Normal select, no generic provided. Value type is inferred from available options.
<SelectControl
	value={ [ 'string' ] }
	multiple
	options={ [
		{
			value: 'string',
			label: 'String',
		},
		{
			value: 'otherstring',
			label: 'Other String',
		},
	] }
/>;

// Normal select, no generic provided. Value type is inferred from available options.
// Incorrect value type provided to test validation is working.
<SelectControl
	// @ts-expect-error "string" is not "narrow" or "value", so throw an error
	value={ [ 'string' ] }
	multiple
	options={ [
		{
			value: 'narrow',
			label: 'Narrow',
		},
		{
			value: 'value',
			label: 'Value',
		},
	] }
/>;

// Select with explicit generic provided.
// Both value and options.value must match the provided generic.
<SelectControl< 'narrow' | 'value' >
	value={ [ 'narrow' ] }
	multiple
	options={ [
		{
			value: 'narrow',
			label: 'Narrow',
		},
		{
			value: 'value',
			label: 'Value',
		},
	] }
/>;
// Select with explicit generic provided.
// Both value and options.value must match the provided generic.
// Value used with multiple matching strings in array.
<SelectControl< 'narrow' | 'value' >
	value={ [ 'narrow', 'value' ] }
	multiple
	options={ [
		{
			value: 'narrow',
			label: 'Narrow',
		},
		{
			value: 'value',
			label: 'Value',
		},
	] }
/>;

// Select with explicit generic provided.
// Both value and options.value must match the provided generic.
// Incorrect value type provided to test validation is working.
<SelectControl< 'narrow' | 'value' >
	// @ts-expect-error "string" is not "narrow" or "value", so throw an error
	value={ [ 'string' ] }
	multiple
	options={ [
		{
			// @ts-expect-error "string" is not "narrow" or "value", so throw an error
			value: 'string',
			label: 'String',
		},
		{
			// @ts-expect-error "otherstring" is not "narrow" or "value", so throw an error
			value: 'otherstring',
			label: 'Other String',
		},
	] }
/>;

// Select with explicit generic provided.
// Both value and options.value must match the provided generic.
// Value with 1 matching and 1 non-matching value provided to test validation is working.
<SelectControl< 'narrow' | 'value' >
	// @ts-expect-error "string" is not "narrow" or "value", so throw an error
	value={ [ 'string', 'narrow' ] }
	multiple
	options={ [
		{
			value: 'narrow',
			label: 'Narrow',
		},
		{
			// @ts-expect-error "string" is not "narrow" or "value", so throw an error
			value: 'string',
			label: 'String',
		},
	] }
/>;
