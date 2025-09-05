/**
 * WordPress dependencies
 */
import {
	Icon,
	privateApis,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { atSymbol, mobile } from '@wordpress/icons';

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
		type?: 'text' | 'email' | 'tel' | 'url';
		/**
		 * Optional icon to display as prefix. If not provided, an appropriate icon will be chosen based on the type.
		 */
		icon?: React.ComponentType;
	};

const getIconForType = ( type?: string ) => {
	switch ( type ) {
		case 'email':
			return atSymbol;
		case 'tel':
			return mobile;
		default:
			return null;
	}
};

export default function ValidatedText< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	type,
	icon,
}: DataFormValidatedTextControlProps< Item > ) {
	const { id, label, placeholder, description } = field;
	const value = field.getValue( { item: data } );
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedInputControl
			>[ 'customValidity' ]
		>( undefined );

	const iconToShow = icon || getIconForType( type );

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
				iconToShow ? (
					<InputControlPrefixWrapper variant="icon">
						<Icon icon={ iconToShow } />
					</InputControlPrefixWrapper>
				) : undefined
			}
			__next40pxDefaultSize
		/>
	);
}
