import {
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Spinner,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import type { DataFormControlProps } from '../../types';
import { ValidatedToggleGroupControl } from '../validated-form-controls';
import getCustomValidity from './utils/get-custom-validity';
import useElements from '../../hooks/use-elements';

export default function ToggleGroup< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< Item > ) {
	const { getValue, setValue, isValid } = field;
	const disabled = field.isDisabled( { item: data, field } );
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
			markWhenOptional={ markWhenOptional }
			customValidity={ getCustomValidity( isValid, validity ) }
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
					disabled={ disabled }
				/>
			) ) }
		</ValidatedToggleGroupControl>
	);
}
