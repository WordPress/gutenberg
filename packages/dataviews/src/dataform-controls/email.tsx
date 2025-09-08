/**
 * WordPress dependencies
 */
import { atSymbol } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import ValidatedText from './utils/validated-text';

export default function Email< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				type: 'email',
				icon: atSymbol,
			} }
		/>
	);
}
