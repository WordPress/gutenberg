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
	EditConfig,
} from '../types';
import checkbox from './checkbox';
import datetime from './datetime';
import date from './date';
import email from './email';
import telephone from './telephone';
import url from './url';
import integer from './integer';
import number from './number';
import radio from './radio';
import select from './select';
import text from './text';
import toggle from './toggle';
import textarea from './textarea';
import toggleGroup from './toggle-group';
import array from './array';
import color from './color';
import password from './password';
import hasElements from '../utils/has-elements';

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
	number,
	password,
	radio,
	select,
	text,
	toggle,
	textarea,
	toggleGroup,
};

function isEditConfig( value: any ): value is EditConfig {
	return (
		value && typeof value === 'object' && typeof value.control === 'string'
	);
}

function createConfiguredControl( config: EditConfig ) {
	const { control, ...controlConfig } = config;
	const BaseControlType = getControlByType( control );

	return function ConfiguredControl< Item >(
		props: DataFormControlProps< Item >
	) {
		return <BaseControlType { ...props } config={ controlConfig } />;
	};
}

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

	if ( isEditConfig( field.Edit ) ) {
		return createConfiguredControl( field.Edit );
	}

	if ( hasElements( field ) && field.type !== 'array' ) {
		return getControlByType( 'select' );
	}

	if ( typeof fieldTypeDefinition.Edit === 'string' ) {
		return getControlByType( fieldTypeDefinition.Edit );
	}

	if ( isEditConfig( fieldTypeDefinition.Edit ) ) {
		return createConfiguredControl( fieldTypeDefinition.Edit );
	}

	return fieldTypeDefinition.Edit;
}

export function getControlByType( type: string ) {
	if ( Object.keys( FORM_CONTROLS ).includes( type ) ) {
		return FORM_CONTROLS[ type ];
	}

	throw 'Control ' + type + ' not found';
}
