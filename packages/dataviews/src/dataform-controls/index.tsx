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
} from '../types';
import checkbox from './checkbox';
import datetime from './datetime';
import date from './date';
import email from './email';
import telephone from './telephone';
import url from './url';
import integer from './integer';
import radio from './radio';
import select from './select';
import text from './text';
import toggle from './toggle';
import toggleGroup from './toggle-group';
import array from './array';
import color from './color';

interface FormControls {
	[ key: string ]: ComponentType< DataFormControlProps< any > >;
}

const FORM_CONTROLS: FormControls = {
	array,
	checkbox,
	color,
	datetime,
	date,
	email,
	telephone,
	url,
	integer,
	radio,
	select,
	text,
	toggle,
	toggleGroup,
};

export function getControl< Item >(
	field: Field< Item >,
	fieldTypeDefinition: FieldTypeDefinition< Item >
) {
	if ( typeof field.Edit === 'function' ) {
		return field.Edit;
	}

	if ( typeof field.Edit === 'string' ) {
		return getControlByType( field.Edit );
	}

	if ( field.elements && field.type !== 'array' ) {
		return getControlByType( 'select' );
	}

	if ( typeof fieldTypeDefinition.Edit === 'string' ) {
		return getControlByType( fieldTypeDefinition.Edit );
	}

	return fieldTypeDefinition.Edit;
}

export function getControlByType( type: string ) {
	if ( Object.keys( FORM_CONTROLS ).includes( type ) ) {
		return FORM_CONTROLS[ type ];
	}

	throw 'Control ' + type + ' not found';
}
