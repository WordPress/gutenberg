/**
 * Internal dependencies
 */
import InputControlPrefixWrapper from './input-prefix-wrapper';
import { VisuallyHidden } from '../visually-hidden';
import {
	Label as BaseLabel,
	LabelWrapper,
	InnerLabelWrapper,
} from './styles/input-control-styles';
import type { WordPressComponentProps } from '../context';
import type { InputControlLabelProps } from './types';

export function Label( {
	children,
	hideLabelFromVision,
	htmlFor,
	...props
}: WordPressComponentProps< InputControlLabelProps, 'label', false > ) {
	if ( ! children ) return null;

	if ( hideLabelFromVision ) {
		return (
			<VisuallyHidden as="label" htmlFor={ htmlFor }>
				{ children }
			</VisuallyHidden>
		);
	}

	return (
		<LabelWrapper>
			<BaseLabel htmlFor={ htmlFor } { ...props }>
				{ children }
			</BaseLabel>
		</LabelWrapper>
	);
}

export function InnerLabel( {
	children,
	htmlFor,
	...props
}: WordPressComponentProps< InputControlLabelProps, 'label', false > ) {
	return (
		<InnerLabelWrapper htmlFor={ htmlFor } { ...props }>
			<InputControlPrefixWrapper>{ children }</InputControlPrefixWrapper>
		</InnerLabelWrapper>
	);
}
