/**
 * WordPress dependencies
 */
import { privateApis } from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';

const { ValidatedTextareaControl } = unlock( privateApis );

export default function Textarea< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	config,
	validity,
}: DataFormControlProps< Item > ) {
	const { rows = 4 } = config || {};
	const { label, placeholder, description, setValue, isValid } = field;
	const value = field.getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	// Convert pattern to string if it's a RegExp
	const pattern = isValid?.pattern
		? isValid.pattern instanceof RegExp
			? isValid.pattern.source
			: isValid.pattern
		: undefined;

	return (
		<ValidatedTextareaControl
			required={ !! isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ label }
			placeholder={ placeholder }
			value={ value ?? '' }
			help={ description }
			onChange={ onChangeControl }
			rows={ rows }
			pattern={ pattern }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}
