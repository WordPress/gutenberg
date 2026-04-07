/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import { mobile } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import ValidatedText from './utils/validated-input';

export default function Telephone< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
	config,
}: DataFormControlProps< Item > ) {
	const { disabled = false } = config || {};
	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				markWhenOptional,
				validity,
				disabled,
				type: 'tel',
				prefix: (
					<InputControlPrefixWrapper variant="icon">
						<Icon icon={ mobile } />
					</InputControlPrefixWrapper>
				),
			} }
		/>
	);
}
