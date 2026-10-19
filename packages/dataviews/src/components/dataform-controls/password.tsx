import { Button } from '@wordpress/components';
import { InputLayout } from '@wordpress/ui';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { seen, unseen } from '@wordpress/icons';
import ValidatedText from './utils/validated-input';
import type { DataFormControlProps } from '../../types';

export default function Password< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< Item > ) {
	const [ isVisible, setIsVisible ] = useState( false );
	const disabled = field.isDisabled( { item: data, field } );

	const toggleVisibility = useCallback( () => {
		setIsVisible( ( prev ) => ! prev );
	}, [] );

	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				markWhenOptional,
				validity,
				type: isVisible ? 'text' : 'password',
				suffix: (
					<InputLayout.Slot padding="minimal">
						<Button
							icon={ isVisible ? unseen : seen }
							onClick={ toggleVisibility }
							size="small"
							label={
								isVisible
									? __( 'Hide password' )
									: __( 'Show password' )
							}
							disabled={ disabled }
							accessibleWhenDisabled
						/>
					</InputLayout.Slot>
				),
			} }
		/>
	);
}
