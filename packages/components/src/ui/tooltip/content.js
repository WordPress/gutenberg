/**
 * External dependencies
 */
import { contextConnect, useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';
// eslint-disable-next-line no-restricted-imports
import { Tooltip as ReakitTooltip } from 'reakit';

/**
 * Internal dependencies
 */
import { View } from '../view';
import { useTooltipContext } from './context';
import * as styles from './styles';

const { TooltipPopoverView } = styles;

/**
 *
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('reakit').TooltipProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
 */
function TooltipContent( props, forwardedRef ) {
	const { children, className, ...otherProps } = useContextSystem(
		props,
		'TooltipContent'
	);
	const { tooltip } = useTooltipContext();
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
