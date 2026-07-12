/**
 * External dependencies
 */
import type { ComponentType, MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import { getActiveFormat, getActiveObject } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';

/*
 * The registered format type settings, as stored by
 * `@wordpress/rich-text`'s format registry. Only the members this
 * component consumes are typed; `edit` receives the props assembled
 * below, which vary per format type.
 */
type FormatSettings = {
	name: string;
	edit?: ComponentType< any >;
};

type ActiveFormat = {
	type: string;
	attributes?: Record< string, string >;
};

type EditProps = {
	onChange: ( value: RichTextValue ) => void;
	onFocus: () => void;
	value: RichTextValue;
	forwardedRef: MutableRefObject< HTMLElement | undefined >;
	isVisible: boolean;
};

const EMPTY_CONTEXT = {};

function Edit( {
	onChange,
	onFocus,
	value,
	forwardedRef,
	settings,
	isVisible,
}: EditProps & { settings: FormatSettings } ) {
	const { name, edit: EditFunction } = settings;

	if ( ! EditFunction ) {
		return null;
	}

	const activeFormat = getActiveFormat( value, name ) as
		| ActiveFormat
		| undefined;
	const isActive = activeFormat !== undefined;
	const activeObject = getActiveObject( value ) as ActiveFormat | undefined;
	const isObjectActive =
		activeObject !== undefined && activeObject.type === name;

	return (
		<EditFunction
			key={ name }
			isActive={ isActive }
			isVisible={ isVisible }
			activeAttributes={ isActive ? activeFormat.attributes || {} : {} }
			isObjectActive={ isObjectActive }
			activeObjectAttributes={
				isObjectActive ? activeObject.attributes || {} : {}
			}
			value={ value }
			onChange={ onChange }
			onFocus={ onFocus }
			contentRef={ forwardedRef }
			context={ EMPTY_CONTEXT }
		/>
	);
}

export default function FormatEdit( {
	formatTypes,
	...props
}: EditProps & { formatTypes: FormatSettings[] } ) {
	return formatTypes.map( ( settings ) => (
		<Edit settings={ settings } { ...props } key={ settings.name } />
	) );
}
