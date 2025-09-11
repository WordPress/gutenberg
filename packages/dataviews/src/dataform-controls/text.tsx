/**
 * WordPress dependencies
 */
import { 
	Icon,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
} from '@wordpress/components';

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
	suffix,
}: DataFormControlProps< Item > & {
	prefix?: React.ComponentType | React.ReactElement;
	suffix?: React.ReactElement;
} ) {
	const wrappedPrefix = prefix ? (
		typeof prefix === 'function' ? (
			<InputControlPrefixWrapper variant="icon">
				<Icon icon={ prefix } />
			</InputControlPrefixWrapper>
		) : (
			<InputControlPrefixWrapper variant="control">
				{ prefix }
			</InputControlPrefixWrapper>
		)
	) : undefined;

	const wrappedSuffix = suffix ? (
		<InputControlSuffixWrapper variant="control">
			{ suffix }
		</InputControlSuffixWrapper>
	) : undefined;

	return (
		<ValidatedText
			{ ...{
				data,
				field,
				onChange,
				hideLabelFromVision,
				prefix: wrappedPrefix,
				suffix: wrappedSuffix,
			} }
		/>
	);
}
