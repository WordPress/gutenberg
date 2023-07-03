/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { Tooltip as ReakitTooltip } from 'reakit';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../context';
import { View } from '../../view';
import { useTooltipContext } from './context';
import * as styles from './styles';
import { useCx } from '../../utils/hooks/use-cx';

const { TooltipPopoverView } = styles;

/**
 *
 * @param {import('../context').WordPressComponentProps<import('./types').ContentProps, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                                   forwardedRef
 */
function TooltipContent( props, forwardedRef ) {
	const { children, className, ...otherProps } = useContextSystem(
		props,
		'TooltipContent'
	);
	const { tooltip } = useTooltipContext();
	const cx = useCx();
	const classes = cx( styles.TooltipContent, className );

	return (
		<ReakitTooltip
			as={ View }
			{ ...otherProps }
			{ ...tooltip }
			className={ classes }
			ref={ forwardedRef }
		>
			<TooltipPopoverView>{ children }</TooltipPopoverView>
		</ReakitTooltip>
	);
}

export default contextConnect( TooltipContent, 'TooltipContent' );
