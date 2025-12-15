/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import {
	Dropdown,
	privateApis,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';

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
	validity,
}: DataFormControlProps< Item > ) {
	const { label, placeholder, description, setValue, isValid } = field;
	const value = field.getValue( { item: data } ) || '';

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

	return (
		<ValidatedInputControl
			required={ !! field.isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
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
