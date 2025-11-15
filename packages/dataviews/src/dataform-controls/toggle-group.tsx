/**
 * WordPress dependencies
 */
import {
	privateApis,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Spinner,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';
import useElements from '../hooks/use-elements';

const { ValidatedToggleGroupControl } = unlock( privateApis );

export default function ToggleGroup< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { getValue, setValue, isValid } = field;
	const value = getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string | number | undefined ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( elements.length === 0 ) {
		return null;
	}

	const selectedOption = elements.find( ( el ) => el.value === value );
	return (
		<ValidatedToggleGroupControl
			required={ !! field.isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			isBlock
			label={ field.label }
			help={ selectedOption?.description || field.description }
			onChange={ onChangeControl }
			value={ value }
			hideLabelFromVision={ hideLabelFromVision }
		>
			{ elements.map( ( el ) => (
				<ToggleGroupControlOption
					key={ el.value }
					label={ el.label }
					value={ el.value }
				/>
			) ) }
		</ValidatedToggleGroupControl>
	);
}
