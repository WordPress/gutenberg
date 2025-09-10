/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import ValidatedText from './utils/validated-input';

export default function Text< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	prefix,
}: DataFormControlProps< Item > & {
	prefix?: React.ComponentType | React.ReactElement;
} ) {
	return (
		<ValidatedText
			{ ...{ data, field, onChange, hideLabelFromVision, icon: prefix } }
		/>
	);
}
