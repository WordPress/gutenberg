/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../visually-hidden';
import { LabelWithTooltip } from '../utils/label-with-tooltip';
import {
	Label as BaseLabel,
	LabelWrapper,
} from './styles/input-control-styles';
import type { WordPressComponentProps } from '../context';
import type { InputControlLabelProps } from './types';

export default function Label( {
	children,
	hideLabelFromVision,
	htmlFor,
	labelTooltip,
	...props
}: WordPressComponentProps< InputControlLabelProps, 'label', false > ) {
	if ( ! children ) {
		return null;
	}

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
				<LabelWithTooltip labelTooltip={ labelTooltip }>
					{ children }
				</LabelWithTooltip>
			</BaseLabel>
		</LabelWrapper>
	);
}
