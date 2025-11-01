/**
 * WordPress dependencies
 */
import {
	Icon,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
} from '@wordpress/components';
import { atSymbol } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import ValidatedText from './utils/validated-input';

export default function Email< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				validity,
				type: 'email',
				prefix: (
					<InputControlPrefixWrapper variant="icon">
						<Icon icon={ atSymbol } />
					</InputControlPrefixWrapper>
				),
			} }
		/>
	);
}
