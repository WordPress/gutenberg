/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { seen, unseen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';

const { ValidatedInputControl } = unlock( privateApis );

export default function Password< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { id, label, placeholder, description } = field;
	const value = field.getValue( { item: data } );
	const [ isVisible, setIsVisible ] = useState( false );
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

	const toggleVisibility = useCallback( () => {
		setIsVisible( ( prev ) => ! prev );
	}, [] );

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
			type={ isVisible ? 'text' : 'password' }
			suffix={
				<InputControlSuffixWrapper variant="control">
					<Button
						icon={ isVisible ? unseen : seen }
						onClick={ toggleVisibility }
						size="small"
						variant="tertiary"
						aria-label={
							isVisible ? 'Hide password' : 'Show password'
						}
					/>
				</InputControlSuffixWrapper>
			}
			__next40pxDefaultSize
		/>
	);
}
