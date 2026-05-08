/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import type {
	DataFormControlProps,
	Field,
	FieldValidity,
} from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

import { Badge } from '@wordpress/ui';
import { cleanForSlug } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import type { ContentType } from '../types';

const { ValidatedInputControl } = unlock( componentsPrivateApis );

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

export const singularLabelField: Field< ContentType > = {
	id: 'singular_name',
	label: __( 'Singular label' ),
	type: 'text',
	getValue: ( { item } ) => item.config.labels.singular_name,
	setValue: ( { item, value } ) => ( {
		config: {
			...item.config,
			labels: {
				...item.config.labels,
				singular_name: String( value ?? '' ),
			},
		},
	} ),
	isValid: {
		required: true,
		maxLength: 200,
	},
	enableSorting: false,
};

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
		isValid: { maxLength: 1000 },
		enableSorting: false,
	};
}

export const statusField: Field< ContentType > = {
	id: 'status',
	label: __( 'Status' ),
	description: __( 'Enabled and registered with WordPress when active.' ),
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

export function SlugEdit( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< any > ) {
	const { label, description, getValue, setValue, isValid } = field;
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
		const maxLength =
			typeof isValid?.maxLength === 'number'
				? isValid.maxLength
				: ( isValid?.maxLength as { constraint?: number } | undefined )
						?.constraint ?? Infinity;
		const trimmed = cleaned
			.slice( 0, maxLength )
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
			maxLength={ isValid.maxLength?.constraint }
		/>
	);
}
