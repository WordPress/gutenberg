/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import type {
	DataFormControlProps,
	Field,
	FieldTypeDefinition,
} from '../../types';
import radio from './radio';

interface FormControls {
	[ key: string ]: ComponentType< DataFormControlProps< any > >;
}

const FORM_CONTROLS: FormControls = {
	radio,
};

export function getControl< Item >(
	field: Field< Item >,
	fieldTypeDefinition: FieldTypeDefinition< Item >
) {
	if ( typeof field.Edit === 'function' ) {
		return field.Edit;
	}

	let control;
	if ( typeof field.Edit === 'string' ) {
		control = getControlByType( field.Edit );
	}

	return control || fieldTypeDefinition.Edit;
}

export function getControlByType( type: string ) {
	if ( Object.keys( FORM_CONTROLS ).includes( type ) ) {
		return FORM_CONTROLS[ type ];
	}

	return null;
}
