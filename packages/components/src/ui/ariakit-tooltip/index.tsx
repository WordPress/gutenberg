/**
 * External dependencies
 */
import { Tooltip, TooltipAnchor, useTooltipState } from 'ariakit/tooltip';

/**
 * Internal dependencies
 */
import type { ToolTipProps } from './types';
import * as styles from './styles';
import { contextConnect } from '../context';
import { useCx } from '../../utils/hooks/use-cx';

function UnforwardedToolTip(
	props: ToolTipProps,
	forwardedRef: React.ForwardedRef< any >
) {
	const { children, placement, text, timeout } = props;

	const tooltipState = useTooltipState( {
		placement,
		timeout,
	} );

	const cx = useCx();
	const ToolTipClassName = cx( styles.ToolTip );

	return (
		<>
			<TooltipAnchor state={ tooltipState } ref={ forwardedRef }>
				{ children }
			</TooltipAnchor>
			{ text && (
				<Tooltip className={ ToolTipClassName } state={ tooltipState }>
					{ text }
				</Tooltip>
			) }
		</>
	);
}

export const ToolTip = contextConnect( UnforwardedToolTip, 'ToolTip' );

export default ToolTip;
