/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useTooltip } from './hook';
import { View } from '../../view';

import type { TooltipProps } from '../types';

const UnconnectedTooltip = (
	props: WordPressComponentProps< TooltipProps, 'span' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const { className, content, ...otherProps } = useTooltip( props );

	return (
		<View
			as="span"
			{ ...otherProps }
			aria-hidden="true"
			className={ className }
			ref={ forwardedRef }
		>
			{ content }
		</View>
	);
};

export const Tooltip = contextConnect( UnconnectedTooltip, 'Tooltip' );
export default Tooltip;
