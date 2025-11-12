/**
 * WordPress dependencies
 */
import {
	CheckboxControl,
	__experimentalVStack as VStack,
	TextControl,
} from '@wordpress/components';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

function PasswordEdit( {
	data,
	onChange,
	field,
}: DataFormControlProps< BasePost > ) {
	const [ showPassword, setShowPassword ] = useState(
		!! field.getValue( { item: data } )
	);

	const handleTogglePassword = ( value: boolean ) => {
		setShowPassword( value );
		if ( ! value ) {
			onChange( { password: '' } );
		}
	};

	return (
		<VStack
			as="fieldset"
			spacing={ 4 }
			className="fields-controls__password"
		>
			<CheckboxControl
				__nextHasNoMarginBottom
				label={ __( 'Password protected' ) }
				help={ __( 'Only visible to those who know the password' ) }
				checked={ showPassword }
				onChange={ handleTogglePassword }
			/>
			{ showPassword && (
				<div className="fields-controls__password-input">
					<TextControl
						label={ __( 'Password' ) }
						onChange={ ( value ) =>
							onChange( {
								password: value,
							} )
						}
						value={ field.getValue( { item: data } ) || '' }
						placeholder={ __( 'Use a secure password' ) }
						type="text"
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						maxLength={ 255 }
					/>
				</div>
			) }
		</VStack>
	);
}
export default PasswordEdit;
