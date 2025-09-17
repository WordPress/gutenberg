/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import {
	privateApis,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';

const { ValidatedToggleGroupControl } = unlock( privateApis );

export default function ToggleGroup< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { getValue, setValue } = field;
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedToggleGroupControl
			>[ 'customValidity' ]
		>( undefined );
	const value = getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string | number | undefined ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);
	const onValidateControl = useCallback(
		( newValue: any ) => {
			const message = field.isValid?.custom?.(
				deepMerge(
					data,
					setValue( {
						item: data,
						value: newValue,
					} ) as Partial< Item >
				),
				field
			);

			if ( message ) {
				setCustomValidity( {
					type: 'invalid',
					message,
				} );
				return;
			}

			setCustomValidity( undefined );
		},
		[ data, field, setValue ]
	);

	if ( field.elements ) {
		const selectedOption = field.elements.find(
			( el ) => el.value === value
		);
		return (
			<ValidatedToggleGroupControl
				required={ !! field.isValid?.required }
				onValidate={ onValidateControl }
				customValidity={ customValidity }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				isBlock
				label={ field.label }
				help={ selectedOption?.description || field.description }
				onChange={ onChangeControl }
				value={ value }
				hideLabelFromVision={ hideLabelFromVision }
			>
				{ field.elements.map( ( el ) => (
					<ToggleGroupControlOption
						key={ el.value }
						label={ el.label }
						value={ el.value }
					/>
				) ) }
			</ValidatedToggleGroupControl>
		);
	}

	return null;
}
