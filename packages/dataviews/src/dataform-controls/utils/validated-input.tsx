/**
 * WordPress dependencies
 */
import {
	Icon,
	privateApis,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import { unlock } from '../../lock-unlock';

const { ValidatedInputControl } = unlock( privateApis );

export type DataFormValidatedTextControlProps< Item > =
	DataFormControlProps< Item > & {
		/**
		 * The input type of the control.
		 */
		type?: 'text' | 'email' | 'tel' | 'url' | 'password';
		/**
		 * Optional icon to display as prefix.
		 */
		icon?: React.ComponentType | React.ReactElement;
		/**
		 * Optional icon to display as suffix.
		 */
		suffix?: React.ReactElement;
	};

export default function ValidatedText< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	type,
	icon,
	suffix,
}: DataFormValidatedTextControlProps< Item > ) {
	const { id, label, placeholder, description } = field;
	const value = field.getValue( { item: data } );
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedInputControl
			>[ 'customValidity' ]
		>( undefined );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	return (
		<ValidatedInputControl
			required={ !! field.isValid?.required }
			onValidate={ ( newValue: any ) => {
				const message = field.isValid?.custom?.(
					{
						...data,
						[ id ]: newValue,
					},
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
			} }
			customValidity={ customValidity }
			label={ label }
			placeholder={ placeholder }
			value={ value ?? '' }
			help={ description }
			onChange={ onChangeControl }
			hideLabelFromVision={ hideLabelFromVision }
			type={ type }
			prefix={
				icon ? (
					<InputControlPrefixWrapper variant="icon">
						<Icon icon={ icon } />
					</InputControlPrefixWrapper>
				) : undefined
			}
			suffix={
				suffix ? (
					<InputControlSuffixWrapper variant="control">
						{ suffix }
					</InputControlSuffixWrapper>
				) : undefined
			}
			__next40pxDefaultSize
		/>
	);
}
