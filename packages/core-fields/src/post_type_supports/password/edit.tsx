import { CheckboxControl as WCCheckboxControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { InputControl, Stack } from '@wordpress/ui';
import type { PostWithPassword } from './types';
import styles from './style.module.css';

/*
 * A copy of the password control of `@wordpress/fields`, laid out with
 * `Stack` and editing the password with `InputControl` from `@wordpress/ui`.
 */
export default function PasswordEdit( {
	data,
	onChange,
	field,
}: {
	data: PostWithPassword;
	onChange: ( value: Partial< PostWithPassword > ) => void;
	field: {
		getValue: ( args: { item: PostWithPassword } ) => string | undefined;
	};
} ) {
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
		<Stack
			render={ <fieldset /> }
			direction="column"
			gap="lg"
			// The editors style the control by the class name of the
			// original.
			className={ clsx( 'fields-controls__password', styles.password ) }
		>
			<WCCheckboxControl
				label={ __( 'Password protected' ) }
				help={ __( 'Only visible to those who know the password' ) }
				checked={ showPassword }
				onChange={ handleTogglePassword }
			/>
			{ showPassword && (
				<InputControl
					label={ __( 'Password' ) }
					onValueChange={ ( value ) =>
						onChange( {
							password: value,
						} )
					}
					value={ field.getValue( { item: data } ) || '' }
					placeholder={ __( 'Use a secure password' ) }
					type="text"
					maxLength={ 255 }
				/>
			) }
		</Stack>
	);
}
