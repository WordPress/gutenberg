/**
 * External dependencies
 */
import { Tooltip, TooltipAnchor, useTooltipState } from 'ariakit/tooltip';

/**
 * Internal dependencies
 */
import Shortcut from '../../shortcut';
import type { ToolTipProps } from './types';
import * as styles from './styles';
import { contextConnect } from '../context';
import { useCx } from '../../utils/hooks/use-cx';

function UnforwardedToolTip(
	props: ToolTipProps,
	forwardedRef: React.ForwardedRef< any >
) {
	const { children, delay, placement, shortcut, text } = props;

	const tooltipState = useTooltipState( {
		placement,
		timeout: delay,
	} );

	const cx = useCx();

	const ToolTipClassName = cx( styles.ToolTip );
	const ToolTipAnchorClassName = cx( styles.ToolTipAnchor );
	const ShortcutClassName = cx( styles.Shortcut );

	return (
		<>
			<TooltipAnchor
				className={ ToolTipAnchorClassName }
				ref={ forwardedRef }
				state={ tooltipState }
			>
				{ children }
			</TooltipAnchor>
			{ ( text || shortcut ) && (
				<Tooltip className={ ToolTipClassName } state={ tooltipState }>
					{ text }
					{ shortcut && (
						<Shortcut
							className={ text ? ShortcutClassName : '' }
							shortcut={ shortcut }
						/>
					) }
				</Tooltip>
			) }
		</>
	);
}

export const ToolTip = contextConnect( UnforwardedToolTip, 'ToolTip' );

export default ToolTip;
