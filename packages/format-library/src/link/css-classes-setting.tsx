import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import {
	__experimentalInputControl as WCInputControl,
	CheckboxControl,
} from '@wordpress/components';
import { Stack, VisuallyHidden } from '@wordpress/ui';
import type { CSSClassesSettingProps } from '../types';

/**
 * CSSClassesSettingComponent
 *
 * Presents a toggleable text input for editing link CSS classes. The input
 * is shown when the toggle is enabled or when there is already a value. When
 * toggled off and a value exists, it resets the value to an empty string.
 *
 * @param props          - Component props.
 * @param props.setting  - Setting configuration object.
 * @param props.value    - Current link value object.
 * @param props.onChange - Callback when value changes.
 */
const CSSClassesSettingComponent = ( {
	setting,
	value,
	onChange,
}: CSSClassesSettingProps ) => {
	const hasValue = !! value?.cssClasses?.length;
	const [ isSettingActive, setIsSettingActive ] = useState( hasValue );
	const instanceId = useInstanceId( CSSClassesSettingComponent );
	const controlledRegionId = `css-classes-setting-${ instanceId }`;

	// Sanitize user input: replace commas with spaces, collapse repeated spaces, and trim
	const handleSettingChange = ( newValue: string | undefined ) => {
		const sanitizedValue =
			typeof newValue === 'string'
				? newValue.replace( /,/g, ' ' ).replace( /\s+/g, ' ' ).trim()
				: newValue;
		onChange( {
			...value,
			[ setting.id ]: sanitizedValue,
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
		<fieldset>
			<VisuallyHidden render={ <legend /> }>
				{ setting.title }
			</VisuallyHidden>
			<Stack direction="column" gap="md">
				<CheckboxControl
					label={ setting.title }
					onChange={ handleCheckboxChange }
					checked={ isSettingActive || hasValue }
					aria-expanded={ isSettingActive }
					aria-controls={
						isSettingActive ? controlledRegionId : undefined
					}
				/>
				{ isSettingActive && (
					<div id={ controlledRegionId }>
						<WCInputControl
							label={ __( 'CSS classes' ) }
							value={ value?.cssClasses }
							onChange={ handleSettingChange }
							help={ __(
								'Separate multiple classes with spaces.'
							) }
							__unstableInputWidth="100%"
						/>
					</div>
				) }
			</Stack>
		</fieldset>
	);
};

export default CSSClassesSettingComponent;
