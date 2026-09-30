import { Icon, InputLayout } from '@wordpress/ui';
import { mobile } from '@wordpress/icons';
import type { DataFormControlProps } from '../../types';
import ValidatedText from './utils/validated-input';

export default function Telephone< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< Item > ) {
	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				markWhenOptional,
				validity,
				type: 'tel',
				prefix: (
					<InputLayout.Slot padding="minimal">
						<Icon icon={ mobile } />
					</InputLayout.Slot>
				),
			} }
		/>
	);
}
