/**
 * WordPress dependencies
 */
import { useCallback, useMemo, useState } from '@wordpress/element';
import { Button, privateApis } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import useFormValidity from '../../hooks/use-form-validity';
import type {
	DataFormControlProps,
	Field,
	FieldValidity,
	NormalizedRules,
} from '../../types';
import DateControl from '../../components/dataform-controls/date';
import { unlock } from '../../lock-unlock';

const { ValidatedTextControl } = unlock( privateApis );

function getCustomValidity< Item >(
	isValid: NormalizedRules< Item >,
	validity: FieldValidity | undefined
) {
	let customValidity;
	if ( isValid?.required && validity?.required ) {
		// If the consumer provides a message for required,
		// use it instead of the native built-in message.
		customValidity = validity?.required?.message
			? validity.required
			: undefined;
	} else if ( isValid?.elements && validity?.elements ) {
		customValidity = validity.elements;
	} else if ( validity?.custom ) {
		customValidity = validity.custom;
	}

	return customValidity;
}

function CustomEditControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, placeholder, description, getValue, setValue, isValid } =
		field;
	const value = getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	return (
		<ValidatedTextControl
			required={ !! isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ label }
			placeholder={ placeholder }
			value={ value ?? '' }
			help={ description }
			onChange={ onChangeControl }
			__next40pxDefaultSize
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}

const ValidationComponent = ( {
	required,
	elements,
	custom,
	pattern,
	minMax,
	layout,
}: {
	required: boolean;
	elements: 'sync' | 'async' | 'none';
	custom: 'sync' | 'async' | 'none';
	pattern: boolean;
	minMax: boolean;
	layout:
		| 'regular'
		| 'panel'
		| 'card-collapsible'
		| 'card-not-collapsible'
		| 'details';
} ) => {
	type ValidatedItem = {
		text: string;
		select?: string;
		textWithRadio?: string;
		textarea: string;
		email: string;
		telephone: string;
		url: string;
		color: string;
		integer: number;
		number: number;
		boolean: boolean;
		customEdit: string;
		categories: string[];
		countries: string[];
		password: string;
		toggle?: boolean;
		toggleGroup?: string;
		combobox?: string;
		date?: string;
		dateRange?: string;
		datetime?: string;
	};

	const [ post, setPost ] = useState< ValidatedItem >( {
		text: 'Can have letters and spaces',
		select: undefined,
		textWithRadio: undefined,
		textarea: 'Can have letters and spaces',
		email: 'hi@example.com',
		telephone: '+306978241796',
		url: 'https://example.com',
		color: '#ff6600',
		integer: 2,
		number: 3.14,
		boolean: true,
		categories: [ 'astronomy' ],
		countries: [ 'us' ],
		customEdit: 'custom control',
		password: 'secretpassword123',
		toggle: undefined,
		toggleGroup: undefined,
		combobox: undefined,
		date: undefined,
		dateRange: undefined,
		datetime: undefined,
	} );

	// Cache for getElements functions - ensures promises are only created once
	const getElements = useMemo( () => {
		const promiseCache: Record< string, Promise< any > > = {};

		return ( fieldId: string ) => {
			return () => {
				if ( fieldId in promiseCache ) {
					return promiseCache[ fieldId ];
				}

				switch ( fieldId ) {
					case 'select':
						promiseCache[ fieldId ] = new Promise( ( resolve ) =>
							setTimeout(
								() =>
									resolve( [
										{
											value: 'option1',
											label: 'Option 1',
										},
										{
											value: 'option2',
											label: 'Option 2',
										},
									] ),
								3500
							)
						);
						break;

					case 'textWithRadio':
						promiseCache[ fieldId ] = new Promise( ( resolve ) =>
							setTimeout(
								() =>
									resolve( [
										{
											value: 'item1',
											label: 'Item 1',
										},
										{
											value: 'item2',
											label: 'Item 2',
										},
									] ),
								3500
							)
						);
						break;

					case 'countries':
						promiseCache[ fieldId ] = new Promise( ( resolve ) =>
							setTimeout(
								() =>
									resolve( [
										{
											value: 'us',
											label: 'United States',
										},
										{
											value: 'ca',
											label: 'Canada',
										},
										{
											value: 'uk',
											label: 'United Kingdom',
										},
										{
											value: 'fr',
											label: 'France',
										},
										{
											value: 'de',
											label: 'Germany',
										},
										{ value: 'jp', label: 'Japan' },
										{
											value: 'au',
											label: 'Australia',
										},
									] ),
								3500
							)
						);
						break;

					case 'toggleGroup':
						promiseCache[ fieldId ] = new Promise( ( resolve ) =>
							setTimeout(
								() =>
									resolve( [
										{
											value: 'option1',
											label: 'Option 1',
										},
										{
											value: 'option2',
											label: 'Option 2',
										},
										{
											value: 'option3',
											label: 'Option 3',
										},
									] ),
								3500
							)
						);
						break;

					case 'combobox':
						promiseCache[ fieldId ] = new Promise( ( resolve ) =>
							setTimeout(
								() =>
									resolve( [
										{ value: 'apple', label: 'Apple' },
										{ value: 'banana', label: 'Banana' },
										{ value: 'cherry', label: 'Cherry' },
										{ value: 'date', label: 'Date' },
										{
											value: 'elderberry',
											label: 'Elderberry',
										},
									] ),
								3500
							)
						);
						break;

					default:
						throw new Error( `Unknown field ID: ${ fieldId }` );
				}

				return promiseCache[ fieldId ];
			};
		};
	}, [] );

	const _fields: Field< ValidatedItem >[] = useMemo( () => {
		const DateRangeEdit = (
			props: DataFormControlProps< ValidatedItem >
		) => {
			return <DateControl { ...props } operator="between" />;
		};
		const makeAsync = (
			rule: ( item: ValidatedItem ) => null | string
		) => {
			return async ( value: ValidatedItem ) => {
				return await new Promise< string | null >( ( resolve ) => {
					setTimeout( () => {
						const validationResult = rule( value );
						resolve( validationResult );
					}, 2000 );
				} );
			};
		};

		const customTextRule = ( value: ValidatedItem ) => {
			if ( ! /^[a-zA-Z ]+$/.test( value.text ) ) {
				return 'Value must only contain letters and spaces.';
			}

			return null;
		};

		const customSelectRule = ( value: ValidatedItem ) => {
			if ( value.select !== 'option1' ) {
				return 'Value must be Option 1.';
			}
			return null;
		};

		const customTextRadioRule = ( value: ValidatedItem ) => {
			if ( value.textWithRadio !== 'item1' ) {
				return 'Value must be Item 1.';
			}

			return null;
		};

		const customTextareaRule = ( value: ValidatedItem ) => {
			if ( ! /^[a-zA-Z ]+$/.test( value.textarea ) ) {
				return 'Value must only contain letters and spaces.';
			}

			return null;
		};
		const customEmailRule = ( value: ValidatedItem ) => {
			if ( ! /^[a-zA-Z0-9._%+-]+@example\.com$/.test( value.email ) ) {
				return 'Email address must be from @example.com domain.';
			}

			return null;
		};
		const customTelephoneRule = ( value: ValidatedItem ) => {
			if ( ! /^\+30\d{10}$/.test( value.telephone ) ) {
				return 'Telephone number must start with +30 and have 10 digits after.';
			}

			return null;
		};
		const customUrlRule = ( value: ValidatedItem ) => {
			if ( ! /^https:\/\/example\.com$/.test( value.url ) ) {
				return 'URL must be from https://example.com domain.';
			}

			return null;
		};
		const customColorRule = ( value: ValidatedItem ) => {
			if ( ! /^#[0-9A-Fa-f]{6}$/.test( value.color ) ) {
				return 'Color must be a valid hex format (e.g., #ff6600).';
			}

			return null;
		};
		const customIntegerRule = ( value: ValidatedItem ) => {
			if ( value.integer % 2 !== 0 ) {
				return 'Integer must be an even number.';
			}

			return null;
		};
		const customNumberRule = ( value: ValidatedItem ) => {
			if ( ! /^\d+\.\d{2}$/.test( value?.number?.toString() ) ) {
				return 'Number must have exactly two decimal places.';
			}

			return null;
		};
		const customBooleanRule = ( value: ValidatedItem ) => {
			if ( value.boolean !== true ) {
				return 'Boolean must be active.';
			}

			return null;
		};
		const customToggleRule = ( value: ValidatedItem ) => {
			if ( value.toggle !== true ) {
				return 'Toggle must be checked.';
			}

			return null;
		};
		const customToggleGroupRule = ( value: ValidatedItem ) => {
			if ( value.toggleGroup !== 'option1' ) {
				return 'Value must be Option 1.';
			}

			return null;
		};

		const customComboboxRule = ( value: ValidatedItem ) => {
			if ( value.combobox !== 'apple' ) {
				return 'Value must be Apple.';
			}

			return null;
		};

		const customPasswordRule = ( value: ValidatedItem ) => {
			if ( value.password.length < 8 ) {
				return 'Password must be at least 8 characters long.';
			}
			if ( ! /[A-Z]/.test( value.password ) ) {
				return 'Password must contain at least one uppercase letter.';
			}
			if ( ! /[0-9]/.test( value.password ) ) {
				return 'Password must contain at least one number.';
			}

			return null;
		};

		const customDateRule = ( value: ValidatedItem ) => {
			if ( ! value.date ) {
				return null;
			}
			const selectedDate = new Date( value.date );
			const today = new Date();
			today.setHours( 0, 0, 0, 0 );
			if ( selectedDate < today ) {
				return 'Date must not be in the past.';
			}

			return null;
		};
		const customDateTimeRule = ( value: ValidatedItem ) => {
			if ( ! value.datetime ) {
				return null;
			}
			const selectedDateTime = new Date( value.datetime );
			const now = new Date();
			if ( selectedDateTime < now ) {
				return 'Date and time must not be in the past.';
			}

			return null;
		};

		const customDateRangeRule = ( value: ValidatedItem ) => {
			if ( ! value.dateRange ) {
				return null;
			}
			const [ fromDate, toDate ] = value.dateRange;
			if ( ! fromDate || ! toDate ) {
				return null;
			}
			const from = new Date( fromDate );
			const to = new Date( toDate );
			const daysDiff = Math.ceil(
				( to.getTime() - from.getTime() ) / ( 1000 * 60 * 60 * 24 )
			);
			if ( daysDiff > 30 ) {
				return 'Date range must not exceed 30 days.';
			}
			return null;
		};

		const maybeCustomRule = (
			rule: ( item: ValidatedItem ) => null | string
		) => {
			if ( custom === 'sync' ) {
				return rule;
			}

			if ( custom === 'async' ) {
				return makeAsync( rule );
			}

			return undefined;
		};

		// Helper functions to avoid nested ternary expressions
		const getValidationPlaceholder = (
			basePattern: string,
			baseMinMax: string,
			bothPattern: string
		) => {
			if ( pattern && minMax ) {
				return bothPattern;
			}
			if ( pattern ) {
				return basePattern;
			}
			if ( minMax ) {
				return baseMinMax;
			}
			return undefined;
		};

		const getValidationDescription = (
			patternDesc: string,
			minMaxDesc: string,
			bothDesc: string
		) => {
			if ( pattern && minMax ) {
				return bothDesc;
			}
			if ( pattern ) {
				return patternDesc;
			}
			if ( minMax ) {
				return minMaxDesc;
			}
			return undefined;
		};

		return [
			{
				id: 'text',
				type: 'text',
				label: 'Text',
				placeholder: getValidationPlaceholder(
					'user_name (alphanumeric+underscore)',
					'Min 5, max 20 characters',
					'user_name (5-20 chars, alphanumeric+underscore)'
				),
				description: getValidationDescription(
					'Must contain only letters, numbers, and underscores',
					'Must be between 5 and 20 characters',
					'Letters, numbers, underscores only AND 5-20 characters'
				),
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customTextRule ),
					pattern: pattern ? '^[a-zA-Z0-9_]+$' : undefined,
					minLength: minMax ? 5 : undefined,
					maxLength: minMax ? 20 : undefined,
				},
			},
			{
				id: 'select',
				type: 'text',
				label: 'Select',
				elements:
					elements === 'async'
						? undefined
						: [
								{ value: 'option1', label: 'Option 1' },
								{ value: 'option2', label: 'Option 2' },
						  ],
				getElements:
					elements === 'async' ? getElements( 'select' ) : undefined,
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customSelectRule ),
				},
			},
			{
				id: 'textWithRadio',
				type: 'text',
				Edit: 'radio',
				label: 'Text with radio',
				elements:
					elements === 'async'
						? undefined
						: [
								{ value: 'item1', label: 'Item 1' },
								{ value: 'item2', label: 'Item 2' },
						  ],
				getElements:
					elements === 'async'
						? getElements( 'textWithRadio' )
						: undefined,
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customTextRadioRule ),
				},
			},
			{
				id: 'textarea',
				type: 'text',
				Edit: 'textarea',
				label: 'Textarea',
				placeholder: minMax ? 'Min 10, max 200 characters' : undefined,
				description: minMax
					? 'Must be between 10 and 200 characters'
					: undefined,
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customTextareaRule ),
					minLength: minMax ? 10 : undefined,
					maxLength: minMax ? 200 : undefined,
				},
			},
			{
				id: 'email',
				type: 'email',
				label: 'e-mail',
				placeholder: getValidationPlaceholder(
					'user@company.com',
					'Min 15, max 100 characters',
					'user@company.com (15-100 chars)'
				),
				description: getValidationDescription(
					'Email must be from @company.com domain',
					'Must be between 15 and 100 characters',
					'Must be @company.com domain AND 15-100 characters'
				),
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customEmailRule ),
					pattern: pattern
						? '^[a-zA-Z0-9._%+-]+@company\\.com$'
						: undefined,
					minLength: minMax ? 15 : undefined,
					maxLength: minMax ? 100 : undefined,
				},
			},
			{
				id: 'telephone',
				type: 'telephone',
				label: 'telephone',
				placeholder: getValidationPlaceholder(
					'+1-555-123-4567',
					'Min 10, max 20 characters',
					'+1-555-123-4567 (10-20 chars)'
				),
				description: getValidationDescription(
					'US phone format with country code',
					'Must be between 10 and 20 characters',
					'US format +1-XXX... AND 10-20 characters'
				),
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customTelephoneRule ),
					pattern: pattern ? '^\\+1-\\d{3}-[0-9-]*$' : undefined,
					minLength: minMax ? 10 : undefined,
					maxLength: minMax ? 20 : undefined,
				},
			},
			{
				id: 'url',
				type: 'url',
				label: 'URL',
				placeholder: getValidationPlaceholder(
					'https://github.com/user/repo',
					'Min 25, max 255 characters',
					'https://github.com/user/repo (10-255 chars)'
				),
				description: getValidationDescription(
					'Must be a GitHub repository URL',
					'Must be between 25 and 255 characters',
					'GitHub repository URL AND 25-255 characters'
				),
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customUrlRule ),
					pattern: pattern
						? '^https:\\/\\/github\\.com\\/.+$'
						: undefined,
					minLength: minMax ? 25 : undefined,
					maxLength: minMax ? 255 : undefined,
				},
			},
			{
				id: 'color',
				type: 'color',
				label: 'Color',
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customColorRule ),
				},
			},
			{
				id: 'integer',
				type: 'integer',
				label: 'Integer',
				placeholder: minMax ? 'Min 10, max 100' : undefined,
				description: minMax ? 'Must be between 10 and 100' : undefined,
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customIntegerRule ),
					min: minMax ? 10 : undefined,
					max: minMax ? 100 : undefined,
				},
			},
			{
				id: 'number',
				type: 'number',
				label: 'Number',
				placeholder: minMax ? 'Min 10, max 100' : undefined,
				description: minMax ? 'Must be between 0 and 100' : undefined,
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customNumberRule ),
					min: minMax ? 10 : undefined,
					max: minMax ? 100 : undefined,
				},
			},
			{
				id: 'boolean',
				type: 'boolean',
				label: 'Boolean',
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customBooleanRule ),
				},
			},
			{
				id: 'array',
				label: 'Array',
				type: 'array',
				placeholder: 'Select countries',
				description: 'Countries you have visited',
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
				},
				elements:
					elements === 'async'
						? undefined
						: [
								{ value: 'us', label: 'United States' },
								{ value: 'ca', label: 'Canada' },
								{ value: 'uk', label: 'United Kingdom' },
								{ value: 'fr', label: 'France' },
								{ value: 'de', label: 'Germany' },
								{ value: 'jp', label: 'Japan' },
								{ value: 'au', label: 'Australia' },
						  ],
				getElements:
					elements === 'async'
						? getElements( 'countries' )
						: undefined,
			},
			{
				id: 'customEdit',
				label: 'Custom Control',
				Edit: CustomEditControl,
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
				},
			},
			{
				id: 'password',
				type: 'password',
				label: 'Password',
				placeholder: getValidationPlaceholder(
					'Must be 8+ alphanumeric',
					'Min 10, max 20 characters',
					'abc12345 (10-20 chars alphanumeric)'
				),
				description: getValidationDescription(
					'Must contain only letters and numbers (8+ chars)',
					'Must be between 10 and 20 characters',
					'alphanumeric chars AND 10-20 characters'
				),
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customPasswordRule ),
					pattern: pattern ? '^[a-zA-Z0-9]{8,}$' : undefined,
					minLength: minMax ? 10 : undefined,
					maxLength: minMax ? 20 : undefined,
				},
			},
			{
				id: 'toggle',
				type: 'boolean',
				label: 'Toggle',
				Edit: 'toggle',
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customToggleRule ),
				},
			},
			{
				id: 'toggleGroup',
				type: 'text',
				label: 'Toggle Group',
				Edit: 'toggleGroup',
				elements:
					elements === 'async'
						? undefined
						: [
								{ value: 'option1', label: 'Option 1' },
								{ value: 'option2', label: 'Option 2' },
								{ value: 'option3', label: 'Option 3' },
						  ],
				getElements:
					elements === 'async'
						? getElements( 'toggleGroup' )
						: undefined,
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customToggleGroupRule ),
				},
			},
			{
				id: 'combobox',
				type: 'text',
				Edit: 'combobox',
				label: 'Combobox',
				placeholder: 'Search and select a fruit',
				elements:
					elements === 'async'
						? undefined
						: [
								{ value: 'apple', label: 'Apple' },
								{ value: 'banana', label: 'Banana' },
								{ value: 'blueberry', label: 'Blueberry' },
								{ value: 'cherry', label: 'Cherry' },
								{ value: 'date', label: 'Date' },
								{ value: 'elderberry', label: 'Elderberry' },
								{ value: 'fig', label: 'Fig' },
								{ value: 'grape', label: 'Grape' },
								{ value: 'honeydew', label: 'Honeydew' },
								{ value: 'kiwi', label: 'Kiwi' },
								{ value: 'lemon', label: 'Lemon' },
								{ value: 'mango', label: 'Mango' },
								{ value: 'nectarine', label: 'Nectarine' },
								{ value: 'orange', label: 'Orange' },
								{ value: 'papaya', label: 'Papaya' },
								{ value: 'pear', label: 'Pear' },
								{ value: 'quince', label: 'Quince' },
								{ value: 'raspberry', label: 'Raspberry' },
								{ value: 'strawberry', label: 'Strawberry' },
								{ value: 'tangerine', label: 'Tangerine' },
								{ value: 'watermelon', label: 'Watermelon' },
						  ],
				getElements:
					elements === 'async'
						? getElements( 'combobox' )
						: undefined,
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customComboboxRule ),
				},
			},
			{
				id: 'date',
				type: 'date',
				label: 'Date',
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customDateRule ),
				},
			},
			{
				id: 'dateRange',
				type: 'date',
				label: 'Date Range',
				Edit: DateRangeEdit,
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customDateRangeRule ),
				},
			},
			{
				id: 'datetime',
				type: 'datetime',
				label: 'Date Time',
				isValid: {
					required,
					elements: elements !== 'none' ? true : false,
					custom: maybeCustomRule( customDateTimeRule ),
				},
			},
		];
	}, [ elements, custom, required, pattern, minMax, getElements ] );

	const form = useMemo( () => {
		if ( layout === 'regular' ) {
			return {
				fields: [
					'text',
					{ id: 'customEdit' },
					{ id: 'level1Integer', children: [ 'integer' ] },
					{
						id: 'level1Number',
						children: [
							{ id: 'level2Number', children: [ 'number' ] },
						],
					},
					{
						id: 'level1Email',
						children: [
							{
								id: 'level2Email',
								children: [
									{
										id: 'level3Email',
										children: [ 'email' ],
									},
								],
							},
						],
					},
					{
						id: 'level1Telephone',
						children: [
							{
								id: 'level2Telephone',
								children: [
									{
										id: 'level3Telephone',
										children: [
											{
												id: 'level4Telephone',
												children: [ 'telephone' ],
											},
										],
									},
								],
							},
						],
					},
					'url',
					'color',
					'password',
					'textarea',
					'select',
					'combobox',
					'textWithRadio',
					'boolean',
					'toggle',
					'toggleGroup',
					'array',
					'date',
					'dateRange',
					'datetime',
				],
			};
		}

		// Panel and card layouts share the same grouped structure
		const groupedFields = [
			{
				id: 'textFields',
				label: 'Text Fields',
				children: [ 'text', 'textarea', 'password', 'customEdit' ],
			},
			{
				id: 'numberFields',
				label: 'Number Fields',
				children: [ 'integer', 'number' ],
			},
			{
				id: 'contactFields',
				label: 'Contact Fields',
				children: [ 'email', 'telephone', 'url' ],
			},
			{
				id: 'selectFields',
				label: 'Selection Fields',
				children: [ 'select', 'combobox', 'textWithRadio' ],
			},
			{
				id: 'booleanFields',
				label: 'Boolean Fields',
				children: [ 'boolean', 'toggle', 'toggleGroup' ],
			},
			{ id: 'color' },
			{ id: 'array' },
			{
				id: 'dateFields',
				label: 'Date Fields',
				children: [ 'date', 'dateRange', 'datetime' ],
			},
		];

		if ( layout === 'panel' ) {
			return {
				layout: { type: 'panel' as const },
				fields: groupedFields,
			};
		}

		if ( layout === 'details' ) {
			return {
				layout: { type: 'details' as const },
				fields: groupedFields,
			};
		}

		if ( layout === 'card-collapsible' ) {
			return {
				layout: { type: 'card' as const },
				fields: groupedFields,
			};
		}

		// card-not-collapsible
		return {
			layout: { type: 'card' as const, isCollapsible: false },
			fields: groupedFields,
		};
	}, [ layout ] );

	const { validity, isValid } = useFormValidity( post, _fields, form );

	return (
		<form>
			<Stack direction="column" align="start" gap="xl">
				<DataForm< ValidatedItem >
					data={ post }
					fields={ _fields }
					form={ form }
					validity={ validity }
					onChange={ ( edits ) =>
						setPost( ( prev ) => ( {
							...prev,
							...edits,
						} ) )
					}
				/>
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					disabled={ ! isValid }
					variant="primary"
				>
					Submit
				</Button>
			</Stack>
		</form>
	);
};

export default ValidationComponent;
