/**
 * WordPress dependencies
 */
import { link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import ValidatedText from './utils/validated-input';

export default function Url< Item >( {
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
				type: 'url',
				icon: link,
			} }
		/>
	);
}
