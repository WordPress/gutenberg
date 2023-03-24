/**
 * External dependencies
 */
import { Tooltip, TooltipAnchor, useTooltipState } from 'ariakit/tooltip';

/**
 * WordPress dependencies
 */
import { Children } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Shortcut from '../../shortcut';
import type { ToolTipProps } from './types';
import * as styles from './styles';
import { contextConnectWithoutRef } from '../context/context-connect';
import { useCx } from '../../utils/hooks/use-cx';

function AriaToolTip( props: ToolTipProps ) {
	const {
		children,
		delay = TOOLTIP_DELAY,
		placement,
		shortcut,
		text,
	} = props;

	const tooltipState = useTooltipState( {
		placement,
		timeout: delay,
	} );

	const isOnlyChild = () => {
		if ( Children.toArray( children?.props?.children ).length === 1 ) {
			return children;
		}
		if ( 'development' === process.env.NODE_ENV ) {
			// eslint-disable-next-line no-console
			return console.error(
				'ToolTip should be called with only a single child element.'
			);
		}
	};

	const cx = useCx();
	const ToolTipClassName = cx( styles.ToolTip );
	const ToolTipAnchorClassName = cx( styles.ToolTipAnchor );
	const ShortcutClassName = cx( styles.Shortcut );

	return (
		<>
			<TooltipAnchor
				className={ ToolTipAnchorClassName }
				state={ tooltipState }
			>
				{ children }
			</TooltipAnchor>
			{ ( text || shortcut ) && isOnlyChild() && (
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

export const ToolTip = contextConnectWithoutRef( AriaToolTip, 'ToolTip' );
