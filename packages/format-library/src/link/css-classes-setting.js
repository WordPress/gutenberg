/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__experimentalInputControl as InputControl,
	CheckboxControl,
} from '@wordpress/components';

/**
 * CSSClassesSettingComponent
 *
 * Presents a toggleable text input for editing link CSS classes. The input
 * is shown when the toggle is enabled or when there is already a value. When
 * toggled off and a value exists, it resets the value to an empty string.
 *
 * @param {Object}   props          - Component props.
 * @param {Object}   props.setting  - Setting configuration object.
 * @param {Object}   props.value    - Current link value object.
 * @param {Function} props.onChange - Callback when value changes.
 */
const CSSClassesSettingComponent = ( { setting, value, onChange } ) => {
	const hasValue = value ? value?.cssClasses?.length > 0 : false;
	const [ isSettingActive, setIsSettingActive ] = useState( hasValue );

	const handleSettingChange = ( newValue ) => {
		onChange( {
			...value,
			[ setting.id ]: newValue,
		} );
	};

	const handleCheckboxChange = () => {
		if ( isSettingActive ) {
			if ( hasValue ) {
				// Reset the value when hiding the input and a value exists.
				handleSettingChange( '' );
			}
			setIsSettingActive( false );
		} else {
			setIsSettingActive( true );
		}
	};

	return (
		<div className="block-editor-link-control__css-classes-setting">
			<CheckboxControl
				__nextHasNoMarginBottom
				label={ setting.title }
				onChange={ handleCheckboxChange }
				checked={ isSettingActive || hasValue }
			/>
			{ isSettingActive && (
				<InputControl
					label={ setting.title }
					value={ value?.cssClasses }
					onChange={ handleSettingChange }
					help={ __( 'Separate multiple classes with spaces.' ) }
					__unstableInputWidth="100%"
					__next40pxDefaultSize
				/>
			) }
		</div>
	);
};

export default CSSClassesSettingComponent;
