/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import {
	ColorPicker,
	Dropdown,
	privateApis,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import { unlock } from '../../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';

const { ValidatedInputControl } = unlock( privateApis );

const ColorPickerDropdown = ( {
	color,
	onColorChange,
}: {
	color: string;
	onColorChange: ( newColor: string ) => void;
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
					<ColorPicker
						color={ validColor }
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
	markWhenOptional,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, placeholder, description, setValue, isValid } = field;
	const value = field.getValue( { item: data } ) || '';

	const handleColorChange = useCallback(
		( newColor: string ) => {
			onChange( setValue( { item: data, value: newColor } ) );
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
			markWhenOptional={ markWhenOptional }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ label }
			placeholder={ placeholder }
			value={ value }
			help={ description }
			onChange={ handleInputChange }
			hideLabelFromVision={ hideLabelFromVision }
			type="text"
			prefix={
				<ColorPickerDropdown
					color={ value }
					onColorChange={ handleColorChange }
				/>
			}
		/>
	);
}
