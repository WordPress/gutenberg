/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import { envelope } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';
import ValidatedText from './utils/validated-input';

export default function Email< Item >( {
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
				type: 'email',
				prefix: (
					<InputControlPrefixWrapper variant="icon">
						<Icon icon={ envelope } />
					</InputControlPrefixWrapper>
				),
			} }
		/>
	);
}
