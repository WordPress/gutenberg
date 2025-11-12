/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { seen, unseen } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import ValidatedText from './utils/validated-input';
import type { DataFormControlProps } from '../types';

export default function Password< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const [ isVisible, setIsVisible ] = useState( false );

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
				validity,
				type: isVisible ? 'text' : 'password',
				suffix: (
					<Button
						icon={ isVisible ? unseen : seen }
						onClick={ toggleVisibility }
						size="small"
						variant="tertiary"
						aria-label={
							isVisible
								? __( 'Hide password' )
								: __( 'Show password' )
						}
					/>
				),
			} }
		/>
	);
}
