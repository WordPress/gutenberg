/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import {
	Button,
	ColorIndicator,
	ColorPicker,
	Dropdown,
	privateApis,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
			className="dataviews-controls__color-picker-dropdown"
			popoverProps={ { resize: false } }
			renderToggle={ ( { onToggle } ) => (
				<Button
					onClick={ onToggle }
					aria-label={ __( 'Open color picker' ) }
					size="small"
					icon={ () => <ColorIndicator colorValue={ validColor } /> }
				/>
			) }
			renderContent={ () => (
				<DropdownContentWrapper paddingSize="none">
					<ColorPicker
						color={ validColor }
						onChange={ onColorChange }
						enableAlpha
					/>
				</DropdownContentWrapper>
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
				<InputControlPrefixWrapper variant="control">
					<ColorPickerDropdown
						color={ value }
						onColorChange={ handleColorChange }
					/>
				</InputControlPrefixWrapper>
			}
		/>
	);
}
