import { Icon, InputLayout } from '@wordpress/ui';
import { link } from '@wordpress/icons';
import type { DataFormControlProps } from '../../types';
import ValidatedText from './utils/validated-input';

export default function Url< Item >( {
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
				type: 'url',
				prefix: (
					<InputLayout.Slot padding="minimal">
						<Icon icon={ link } />
					</InputLayout.Slot>
				),
			} }
		/>
	);
}
