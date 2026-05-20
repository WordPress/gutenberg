/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import type {
	DataFormControlProps,
	Field,
	FieldValidity,
	NormalizedRules,
} from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

import { Badge } from '@wordpress/ui';
import { cleanForSlug } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import type { ContentType } from '../types';

const { ValidatedInputControl, ValidatedToggleControl } = unlock(
	componentsPrivateApis
);

// Surface field-level validity messages in priority order: structural rules
// (required, pattern, maxLength) first, async/custom last. `required` only
// overrides the native browser message when our rule supplies one of its own.
export function getCustomValidity( validity?: FieldValidity ) {
	if ( validity?.required?.message ) {
		return validity.required;
	}
	if ( validity?.pattern ) {
		return validity.pattern;
	}
	if ( validity?.maxLength ) {
		return validity.maxLength;
	}
	return validity?.custom;
}

export function createBooleanField(
	id: string,
	label: string,
	options: {
		description: string;
		isVisible?: ( item: any ) => boolean;
	}
): Field< ContentType > {
	const field: Field< ContentType > = {
		id,
		label,
		type: 'boolean',
		description: options.description,
		Edit: 'toggle',
		getValue: ( { item } ) =>
			( item.config as Record< string, any > )[ id ],
		setValue: ( { item, value } ) =>
			( {
				config: { ...item.config, [ id ]: !! value },
			} ) as Partial< ContentType >,
		filterBy: false,
		enableSorting: false,
	};
	if ( options.isVisible ) {
		field.isVisible = options.isVisible;
	}
	return field;
}

export function createLabelField(
	id: string,
	label: string,
	options: {
		placeholder?: string;
		description?: string;
		isVisible?: ( item: any ) => boolean;
		required?: boolean;
	} = {}
): Field< ContentType > {
	const field: Field< ContentType > = {
		id,
		label,
		type: 'text',
		placeholder: options.placeholder,
		description: options.description,
		getValue: ( { item } ) =>
			( item.config.labels as Record< string, any > )[ id ] ?? '',
		setValue: ( { item, value } ) =>
			( {
				config: {
					...item.config,
					labels: {
						...item.config.labels,
						[ id ]: String( value ?? '' ),
					},
				},
			} ) as Partial< ContentType >,
		isValid: {
			...( options.required ? { required: true } : {} ),
			// Mirrors the server REST schema: 200 chars for labels.
			maxLength: 200,
		},
		enableSorting: false,
	};
	if ( options.isVisible ) {
		field.isVisible = options.isVisible;
	}
	return field;
}

export const titleField: Field< ContentType > = {
	id: 'title',
	label: __( 'Title' ),
	type: 'text',
	enableGlobalSearch: true,
	getValue: ( { item } ) => item.title.raw,
	setValue: ( { value } ) => ( {
		title: { raw: String( value ?? '' ) },
	} ),
	isValid: {
		required: true,
		// Title is stored as the plural label — mirrors the server REST schema (200 chars).
		maxLength: 200,
	},
	filterBy: false,
	enableHiding: false,
};

export const pluralLabelField: Field< ContentType > = {
	id: 'plural_name',
	label: __( 'Plural label' ),
	type: 'text',
	getValue: ( { item } ) => item.title.raw,
	setValue: ( { value } ) => ( {
		title: { raw: String( value ?? '' ) },
	} ),
	isValid: {
		required: true,
		maxLength: 200,
	},
};

export const singularLabelField = createLabelField(
	'singular_name',
	__( 'Singular label' ),
	{ required: true }
);

export function createDescriptionField(
	description: string
): Field< ContentType > {
	return {
		id: 'description',
		label: __( 'Description' ),
		type: 'text',
		Edit: { control: 'textarea', rows: 3 },
		description,
		getValue: ( { item } ) => item.config.description,
		setValue: ( { item, value } ) => ( {
			config: { ...item.config, description: String( value ?? '' ) },
		} ),
		// Mirrors the server REST schema (1000 chars for description).
		isValid: { maxLength: 1000 },
		enableSorting: false,
	};
}

export const statusField: Field< ContentType > = {
	id: 'status',
	label: __( 'Status' ),
	description: __( 'Enabled and registered with WordPress when active.' ),
	// The field keeps `label: 'Status'` so the filter chip and column header
	// read naturally ("Status: Active"); the form toggle uses its own "Active"
	// label — the on/off semantic is clearer next to a switch.
	Edit: ( {
		data,
		field,
		onChange,
		hideLabelFromVision,
		markWhenOptional,
		validity,
	} ) => {
		const isActive = field.getValue( { item: data } ) === 'publish';
		return (
			<ValidatedToggleControl
				label={ __( 'Active' ) }
				hidden={ hideLabelFromVision }
				help={ field.description }
				markWhenOptional={ markWhenOptional }
				customValidity={ getCustomValidity( validity ) }
				checked={ isActive }
				onChange={ ( next: boolean ) =>
					onChange(
						field.setValue( {
							item: data,
							value: next ? 'publish' : 'draft',
						} )
					)
				}
			/>
		);
	},
	elements: [
		{ value: 'publish', label: __( 'Active' ) },
		{ value: 'draft', label: __( 'Inactive' ) },
	],
	render: ( { item } ) => {
		const isActive = item.status === 'publish';
		return (
			<Badge intent={ isActive ? 'stable' : 'draft' }>
				{ isActive ? __( 'Active' ) : __( 'Inactive' ) }
			</Badge>
		);
	},
	enableSorting: false,
};

// `SlugEdit` is internal to this package and only used by the slug field
// produced by the two `useSlugField` hooks, which always declare
// `isValid.maxLength`. The internal `SlugFieldRules` cast narrows it so the
// constraint can be read without optional chaining or fallbacks.
type SlugFieldRules< T > = NormalizedRules< T > & {
	maxLength: NonNullable< NormalizedRules< T >[ 'maxLength' ] >;
};

export function SlugEdit< T extends ContentType >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< T > ) {
	const { label, description, getValue, setValue } = field;
	const isValid = field.isValid as SlugFieldRules< T >;
	const value = ( getValue( { item: data } ) as string | undefined ) ?? '';
	const handleChange = ( newValue: string ) =>
		onChange( setValue( { item: data, value: newValue } ) );
	const onFocus = () => {
		if ( data.id !== undefined || data.slug ) {
			return;
		}
		const singular = data.config.labels.singular_name?.trim();
		if ( ! singular ) {
			return;
		}
		const cleaned = cleanForSlug( singular );
		// On a fresh record fill the input from the singular label.
		// Skip auto-fill if cleanForSlug retained non-ASCII to match
		// the server's sanitize_key charset.
		if ( /[^a-z0-9_-]/.test( cleaned ) ) {
			return;
		}
		const trimmed = cleaned
			.slice( 0, isValid.maxLength.constraint )
			// Slicing can introduce a trailing hyphen — strip it.
			.replace( /-+$/, '' );
		if ( trimmed ) {
			handleChange( trimmed );
		}
	};
	return (
		<ValidatedInputControl
			__next40pxDefaultSize
			required={ !! isValid.required }
			markWhenOptional={ markWhenOptional }
			customValidity={ getCustomValidity( validity ) }
			label={ label }
			value={ value }
			help={ description }
			onChange={ handleChange }
			onFocus={ onFocus }
			hideLabelFromVision={ hideLabelFromVision }
			pattern={ isValid.pattern?.constraint }
			maxLength={ isValid.maxLength.constraint }
		/>
	);
}
