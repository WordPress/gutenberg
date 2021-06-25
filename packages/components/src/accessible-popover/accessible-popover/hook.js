/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { usePopoverState } from 'reakit';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').Props, 'div'>} props
 */
export function useAccessiblePopover( props ) {
	const {
		animated = true,
		animationDuration = 160,
		baseId,
		elevation = 5,
		id,
		maxWidth = 360,
		placement,
		state,
		visible,
		...otherProps
	} = useContextSystem( props, 'AccessiblePopover' );

	const _popover = usePopoverState( {
		animated: animated ? animationDuration : undefined,
		baseId: baseId || id,
		placement,
		visible,
		...otherProps,
	} );

	const popover = state || _popover;

	return {
		...otherProps,
		elevation,
		maxWidth,
		popover,
	};
}
