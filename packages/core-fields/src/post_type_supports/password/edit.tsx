import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { CheckboxControl, InputControl, Stack } from '@wordpress/ui';
import type { PostWithPassword } from './types';
import styles from './style.module.css';

/*
 * A copy of the password control of `@wordpress/fields`, laid out with
 * `Stack` and built from `CheckboxControl` and `InputControl` of
 * `@wordpress/ui`.
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
			<CheckboxControl
				label={ __( 'Password protected' ) }
				description={ __(
					'Only visible to those who know the password'
				) }
				checked={ showPassword }
				onCheckedChange={ handleTogglePassword }
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
