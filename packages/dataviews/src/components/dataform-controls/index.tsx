/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import type { DataFormControlProps, Field, EditConfig } from '../../types';
import checkbox from './checkbox';
import combobox from './combobox';
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
import hasElements from '../../field-types/utils/has-elements';

interface FormControls {
	[ key: string ]: ComponentType< DataFormControlProps< any > >;
}

const FORM_CONTROLS: FormControls = {
	array,
	checkbox,
	color,
	combobox,
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

function createConfiguredControl(
	config: EditConfig,
	customControls?: FormControls
) {
	const { control, ...controlConfig } = config;
	const BaseControlType = getControlByType( control, customControls );
	if ( BaseControlType === null ) {
		return null;
	}

	return function ConfiguredControl< Item >(
		props: DataFormControlProps< Item >
	) {
		return <BaseControlType { ...props } config={ controlConfig } />;
	};
}

export function getControl< Item >(
	field: Field< Item >,
	fallback: string | null,
	customControls?: FormControls
): ComponentType< DataFormControlProps< Item > > | null {
	if ( typeof field.Edit === 'function' ) {
		return field.Edit;
	}

	if ( typeof field.Edit === 'string' ) {
		return getControlByType( field.Edit, customControls );
	}

	if ( isEditConfig( field.Edit ) ) {
		return createConfiguredControl( field.Edit, customControls );
	}

	if ( hasElements( field ) && field.type !== 'array' ) {
		return getControlByType( 'select', customControls );
	}

	if ( fallback === null ) {
		return null;
	}

	return getControlByType( fallback, customControls );
}

export function getControlByType(
	type: string,
	customControls?: FormControls
) {
	// Check custom controls first (they take precedence)
	if ( customControls && Object.keys( customControls ).includes( type ) ) {
		return customControls[ type ];
	}

	if ( Object.keys( FORM_CONTROLS ).includes( type ) ) {
		return FORM_CONTROLS[ type ];
	}

	return null;
}
