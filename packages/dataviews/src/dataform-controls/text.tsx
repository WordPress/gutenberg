/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import Input from './input';

export default function Text< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	return <Input { ...{ data, field, onChange, hideLabelFromVision } } />;
}
