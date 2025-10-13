/**
 * External dependencies
 */
import { colord } from 'colord';
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import {
	Dropdown,
	privateApis,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';

const { ValidatedInputControl, Picker } = unlock( privateApis );

const ColorPicker = ( {
	color,
	onColorChange,
}: {
	color: string;
	onColorChange: ( colorObject: any ) => void;
} ) => {
	const validColor = color && colord( color ).isValid() ? color : '#ffffff';

	return (
		<Dropdown
			renderToggle={ ( { onToggle, isOpen } ) => (
				<InputControlPrefixWrapper variant="icon">
					<button
						type="button"
						onClick={ onToggle }
						style={ {
							width: '24px',
							height: '24px',
							borderRadius: '50%',
							backgroundColor: validColor,
							border: '1px solid #ddd',
							cursor: 'pointer',
							outline: isOpen ? '2px solid #007cba' : 'none',
							outlineOffset: '2px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: 0,
							margin: 0,
						} }
						aria-label="Open color picker"
					/>
				</InputControlPrefixWrapper>
			) }
			renderContent={ () => (
				<div style={ { padding: '16px' } }>
					<Picker
						color={ colord( validColor ) }
						onChange={ onColorChange }
						enableAlpha
					/>
				</div>
			) }
		/>
	);
};

export default function Color< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, placeholder, description, setValue } = field;
	const value = field.getValue( { item: data } ) || '';
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedInputControl
			>[ 'customValidity' ]
		>( undefined );

	const handleColorChange = useCallback(
		( colorObject: any ) => {
			onChange( setValue( { item: data, value: colorObject.toHex() } ) );
		},
		[ data, onChange, setValue ]
	);

	const handleInputChange = useCallback(
		( newValue: string | undefined ) => {
			onChange( setValue( { item: data, value: newValue || '' } ) );
		},
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

	return (
		<ValidatedInputControl
			required={ !! field.isValid?.required }
			onValidate={ onValidateControl }
			customValidity={ customValidity }
			label={ label }
			placeholder={ placeholder }
			value={ value }
			help={ description }
			onChange={ handleInputChange }
			hideLabelFromVision={ hideLabelFromVision }
			type="text"
			prefix={
				<ColorPicker
					color={ value }
					onColorChange={ handleColorChange }
				/>
			}
		/>
	);
}
