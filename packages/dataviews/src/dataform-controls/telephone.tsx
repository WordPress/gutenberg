/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import Text from './text';

export default function Telephone< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	return (
		<Text
			{ ...{ data, field, onChange, hideLabelFromVision, type: 'tel' } }
		/>
	);
}
